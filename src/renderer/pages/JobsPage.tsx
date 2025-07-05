/**
 * Jobs Page
 *
 * Job description matching and gap analysis.
 */

import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sparkles,
  Copy,
  Plus,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { useAppStore } from '../stores/app-store';
import { cn } from '../lib/utils';

// Mock job matching data
const mockMatchResults = {
  overallScore: 78,
  matchedSkills: [
    { name: 'Python', required: true, matched: true },
    { name: 'JavaScript', required: true, matched: true },
    { name: 'React', required: true, matched: true },
    { name: 'TypeScript', required: false, matched: true },
    { name: 'Node.js', required: true, matched: true },
    { name: 'PostgreSQL', required: true, matched: false },
    { name: 'Kubernetes', required: false, matched: false },
    { name: 'GraphQL', required: false, matched: false },
  ],
  experienceMatch: {
    required: '5+ years',
    estimated: '4-6 years',
    score: 85,
  },
  recommendations: [
    {
      type: 'skill_gap',
      message: 'Consider highlighting any PostgreSQL experience or similar database skills',
      priority: 'high',
    },
    {
      type: 'skill_gap',
      message: 'Kubernetes knowledge would strengthen your application',
      priority: 'medium',
    },
    {
      type: 'enhancement',
      message: 'Your React experience is a strong match - emphasize complex projects',
      priority: 'low',
    },
  ],
};

const priorityColors: Record<string, string> = {
  high: 'text-destructive',
  medium: 'text-warning',
  low: 'text-info',
};

export const JobsPage: React.FC = () => {
  const { currentProject } = useAppStore();
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleAnalyze = () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasResults(true);
    }, 2000);
  };

  const matchedRequired = mockMatchResults.matchedSkills.filter(
    (s) => s.required && s.matched
  ).length;
  const totalRequired = mockMatchResults.matchedSkills.filter((s) => s.required).length;

  if (!currentProject) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Import conversation data to match against job descriptions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Job Description Input */}
      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>
            Paste a job description to analyze skill matches and gaps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste the job description here...

Example:
We are looking for a Senior Full-Stack Developer with:
- 5+ years of experience with Python and JavaScript
- Strong knowledge of React and Node.js
- Experience with PostgreSQL and cloud platforms
- Familiarity with CI/CD pipelines"
            className="min-h-[200px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setJobDescription('')}>
            Clear
          </Button>
          <Button onClick={handleAnalyze} isLoading={isAnalyzing}>
            <Search className="mr-2 h-4 w-4" />
            Analyze Match
          </Button>
        </CardFooter>
      </Card>

      {/* Results */}
      {hasResults && (
        <>
          {/* Match Score */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Overall Match Score</h3>
                  <p className="text-sm text-muted-foreground">
                    {matchedRequired}/{totalRequired} required skills matched
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-4xl font-bold',
                      mockMatchResults.overallScore >= 80
                        ? 'text-success'
                        : mockMatchResults.overallScore >= 60
                          ? 'text-warning'
                          : 'text-destructive'
                    )}
                  >
                    {mockMatchResults.overallScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">compatibility</p>
                </div>
              </div>
              <Progress
                value={mockMatchResults.overallScore}
                className="mt-4"
                variant={
                  mockMatchResults.overallScore >= 80
                    ? 'success'
                    : mockMatchResults.overallScore >= 60
                      ? 'warning'
                      : 'destructive'
                }
              />
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs defaultValue="skills">
            <TabsList>
              <TabsTrigger value="skills">Skills Match</TabsTrigger>
              <TabsTrigger value="gaps">Gap Analysis</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            {/* Skills Tab */}
            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Skills Comparison</CardTitle>
                  <CardDescription>How your skills align with job requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {mockMatchResults.matchedSkills.map((skill) => (
                      <div
                        key={skill.name}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-3',
                          skill.matched
                            ? 'border-success/30 bg-success/5'
                            : 'border-destructive/30 bg-destructive/5'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {skill.matched ? (
                            <CheckCircle className="h-5 w-5 text-success" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <span className="font-medium">{skill.name}</span>
                        </div>
                        <span
                          className={cn(
                            'text-xs',
                            skill.required ? 'font-medium text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {skill.required ? 'Required' : 'Nice to have'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gap Analysis Tab */}
            <TabsContent value="gaps">
              <Card>
                <CardHeader>
                  <CardTitle>Skill Gaps</CardTitle>
                  <CardDescription>
                    Areas where you might need to strengthen your profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMatchResults.matchedSkills
                      .filter((s) => !s.matched)
                      .map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-start gap-4 rounded-lg border p-4"
                        >
                          <AlertTriangle
                            className={cn(
                              'mt-0.5 h-5 w-5',
                              skill.required ? 'text-destructive' : 'text-warning'
                            )}
                          />
                          <div className="flex-1">
                            <p className="font-medium">{skill.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {skill.required
                                ? 'This is a required skill. Consider highlighting related experience or learning resources.'
                                : 'This is a nice-to-have skill. Having it would strengthen your application.'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'status-badge',
                              skill.required ? 'status-error' : 'status-warning'
                            )}
                          >
                            {skill.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      ))}
                    {mockMatchResults.matchedSkills.filter((s) => !s.matched).length === 0 && (
                      <div className="flex flex-col items-center py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-success" />
                        <p className="mt-4 font-medium">No significant gaps found!</p>
                        <p className="text-sm text-muted-foreground">
                          Your skills align well with this position
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>AI Recommendations</CardTitle>
                  <CardDescription>
                    Personalized suggestions to improve your application
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockMatchResults.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-4 rounded-lg border p-4">
                        <Sparkles className={cn('mt-0.5 h-5 w-5', priorityColors[rec.priority])} />
                        <div className="flex-1">
                          <p className="text-sm">{rec.message}</p>
                        </div>
                        <span
                          className={cn(
                            'status-badge',
                            rec.priority === 'high'
                              ? 'status-error'
                              : rec.priority === 'medium'
                                ? 'status-warning'
                                : 'status-info'
                          )}
                        >
                          {rec.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Recommendations
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Saved Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Saved Jobs</CardTitle>
            <CardDescription>Previously analyzed job descriptions</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
            <Briefcase className="h-8 w-8" />
            <p className="mt-2 text-sm">No saved jobs yet</p>
            <p className="text-xs">Analyze a job description to save it here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
