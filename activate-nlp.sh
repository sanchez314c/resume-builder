#!/bin/bash
# Activate the Resume Builder Conda environment
eval "$(conda shell.bash hook)"
conda activate resume-builder
echo "Activated: $CONDA_DEFAULT_ENV"
