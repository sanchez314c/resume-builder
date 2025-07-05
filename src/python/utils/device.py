"""
Device Management Utilities

Handles detection and management of compute devices
(CUDA, MPS, CPU) for optimal model execution.

CRITICAL NOTE:
Apple's MPS (Metal Performance Shaders) is a SINGLE device.
There is NO mps:0 or mps:1 syntax. Always use just "mps".
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Literal, Optional

from loguru import logger

if TYPE_CHECKING:
    import torch


DeviceType = Literal["cuda", "mps", "cpu"]


class DeviceManager:
    """
    Manages compute device detection and selection.

    Provides utilities for detecting available hardware
    acceleration and monitoring memory usage.
    """

    _device: Optional[DeviceType] = None
    _device_info: Optional[dict] = None

    @classmethod
    def get_device(cls) -> DeviceType:
        """
        Get the optimal compute device.

        Returns:
            DeviceType: 'cuda' for NVIDIA GPUs, 'mps' for Apple Silicon, 'cpu' otherwise.

        Note:
            MPS is a SINGLE device. Never use 'mps:0' - just use 'mps'.
        """
        if cls._device is not None:
            return cls._device

        cls._device = cls._detect_device()
        return cls._device

    @classmethod
    def _detect_device(cls) -> DeviceType:
        """Detect available compute device."""
        try:
            import torch

            # Check for CUDA (NVIDIA GPU)
            if torch.cuda.is_available():
                device_name = torch.cuda.get_device_name(0)
                memory_gb = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                logger.info(f"CUDA device detected: {device_name} ({memory_gb:.1f} GB)")
                cls._device_info = {
                    "type": "cuda",
                    "name": device_name,
                    "memory_gb": memory_gb,
                }
                return "cuda"

            # Check for MPS (Apple Silicon)
            # CRITICAL: MPS is a single device - NO mps:0 syntax
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                # Verify MPS is actually functional
                try:
                    test_tensor = torch.zeros(1, device="mps")
                    del test_tensor
                    logger.info("Apple MPS device detected and functional")
                    cls._device_info = {
                        "type": "mps",
                        "name": "Apple Metal Performance Shaders",
                        "memory_gb": None,  # MPS shares system memory
                    }
                    return "mps"
                except Exception as e:
                    logger.warning(f"MPS available but not functional: {e}")

            # Fallback to CPU
            logger.info("Using CPU for computation")
            cls._device_info = {
                "type": "cpu",
                "name": "CPU",
                "memory_gb": None,
            }
            return "cpu"

        except ImportError:
            logger.warning("PyTorch not installed, defaulting to CPU")
            return "cpu"
        except Exception as e:
            logger.warning(f"Error detecting device: {e}, defaulting to CPU")
            return "cpu"

    @classmethod
    def get_device_info(cls) -> dict:
        """
        Get detailed information about the compute device.

        Returns:
            Dictionary with device type, name, and memory info.
        """
        if cls._device_info is None:
            cls.get_device()  # Trigger detection
        return cls._device_info or {"type": "cpu", "name": "CPU", "memory_gb": None}

    @classmethod
    def get_memory_usage(cls) -> Optional[dict]:
        """
        Get current memory usage for GPU devices.

        Returns:
            Dictionary with allocated and cached memory, or None if not applicable.
        """
        device = cls.get_device()

        if device != "cuda":
            return None

        try:
            import torch

            allocated = torch.cuda.memory_allocated() / (1024**3)
            cached = torch.cuda.memory_reserved() / (1024**3)
            total = torch.cuda.get_device_properties(0).total_memory / (1024**3)

            return {
                "allocated_gb": round(allocated, 2),
                "cached_gb": round(cached, 2),
                "total_gb": round(total, 2),
                "free_gb": round(total - allocated, 2),
            }
        except Exception as e:
            logger.warning(f"Failed to get memory usage: {e}")
            return None

    @classmethod
    def clear_cache(cls) -> None:
        """
        Clear GPU cache to free memory.

        Works for both CUDA and MPS devices.
        """
        device = cls.get_device()

        try:
            import torch

            if device == "cuda":
                torch.cuda.empty_cache()
                logger.info("CUDA cache cleared")
            elif device == "mps":
                # MPS doesn't have explicit cache clearing, but we can trigger GC
                import gc

                gc.collect()
                if hasattr(torch.mps, "empty_cache"):
                    torch.mps.empty_cache()
                logger.info("MPS cache cleared")

        except Exception as e:
            logger.warning(f"Failed to clear cache: {e}")

    @classmethod
    def get_torch_device(cls) -> torch.device:
        """
        Get a torch.device object for the optimal device.

        Returns:
            torch.device configured for the detected hardware.

        Note:
            For MPS, returns torch.device("mps"), NOT torch.device("mps:0").
        """
        import torch

        device = cls.get_device()

        # CRITICAL: MPS is a single device, never use "mps:0"
        if device == "mps":
            return torch.device("mps")
        elif device == "cuda":
            return torch.device("cuda:0")
        else:
            return torch.device("cpu")

    @classmethod
    def is_gpu_available(cls) -> bool:
        """Check if any GPU acceleration is available."""
        device = cls.get_device()
        return device in ("cuda", "mps")

    @classmethod
    def get_device_for_transformers(cls) -> int | str:
        """
        Get device specification for HuggingFace transformers.

        Returns:
            Device specification compatible with transformers pipeline.
            - 0 for CUDA
            - "mps" for MPS
            - -1 for CPU
        """
        device = cls.get_device()

        if device == "cuda":
            return 0
        elif device == "mps":
            return "mps"
        else:
            return -1

    @classmethod
    def reset(cls) -> None:
        """Reset cached device detection."""
        cls._device = None
        cls._device_info = None


# =============================================================================
# Module exports
# =============================================================================

__all__ = ["DeviceManager", "DeviceType"]
