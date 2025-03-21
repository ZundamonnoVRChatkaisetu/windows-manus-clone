import { useState } from 'react';
import { 
  RocketIcon, Check, Loader2, Globe, Server, Lock, ShieldAlert, Users, 
  Database, CreditCard, Calendar, Check, ChevronRight, AlertCircle, ExternalLink
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Website } from './site-builder';

export interface DeploySettings {
  domainName: string;
  subdomain: string;
  hostingPlan: 'basic' | 'standard' | 'premium';
  sslEnabled: boolean;
  analytics: boolean;
  backups: boolean;
  advancedSettings: {
    caching: boolean;
    cdnEnabled: boolean;
    passwordProtection: boolean;
    customHeadersEnabled: boolean;
    customHeaders: string;
  };
}

interface DeployPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  storage: string;
  bandwidth: string;
  isRecommended?: boolean;
}

export interface DeployWizardProps {
  website: Website;
  onDeploy: (settings: DeploySettings) => Promise<boolean>;
  onCancel: () => void;
}

export function DeployWizard({
  website,
  onDeploy,
  onCancel,
}: DeployWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<
    'idle' | 'deploying' | 'success' | 'error'
  >('idle');
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<DeploySettings>({
    domainName: '',
    subdomain: website.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    hostingPlan: 'basic',
    sslEnabled: true,
    analytics: true,
    backups: false,
    advancedSettings: {
      caching: true,
      cdnEnabled: false,
      passwordProtection: false,
      customHeadersEnabled: false,
      customHeaders: '',
    },
  });

  const plans: DeployPlan[] = [
    {
      id: 'basic',
      name: 'Basic',
      price: '$5/month',
      features: [
        'Custom subdomain',
        'Automatic SSL',
        'Basic analytics',
        '99.9% uptime',
      ],
      storage: '10 GB',
      bandwidth: '100 GB/month',
    },
    {
      id: 'standard',
      name: 'Standard',
      price: '$12/month',
      features: [
        'Custom domain',
        'Advanced analytics',
        'Daily backups',
        'CDN support',
        'Email support',
      ],
      storage: '20 GB',
      bandwidth: '500 GB/month',
      isRecommended: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$25/month',
      features: [
        'Multiple domains',
        'Realtime analytics',
        'Hourly backups',
        'Global CDN',
        'Priority support',
        'Staging environment',
      ],
      storage: '50 GB',
      bandwidth: 'Unlimited',
    },
  ];

  const handleDeployment = async () => {
    setIsDeploying(true);
    setDeploymentStatus('deploying');
    setDeploymentProgress(0);
    
    // Simulate deployment progress
    const progressInterval = setInterval(() => {
      setDeploymentProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 500);
    
    try {
      // Call the actual deployment function
      const success = await onDeploy(settings);
      
      clearInterval(progressInterval);
      
      if (success) {
        setDeploymentProgress(100);
        setDeploymentStatus('success');
        setDeploymentUrl(`https://${settings.subdomain}.example.com`);
        
        toast({
          title: "Deployment Successful",
          description: "Your website has been deployed successfully.",
        });
      } else {
        setDeploymentStatus('error');
        
        toast({
          title: "Deployment Failed",
          description: "There was an error deploying your website. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setDeploymentStatus('error');
      
      toast({
        title: "Deployment Error",
        description: "An unexpected error occurred during deployment.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDeployment();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return !!settings.subdomain;
    }
    if (currentStep === 2) {
      return !!settings.hostingPlan;
    }
    return true;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Deploy Your Website</CardTitle>
            <CardDescription>
              Configure deployment settings for {website.name}
            </CardDescription>
          </div>
          <RocketIcon className="h-5 w-5 text-primary" />
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
                {currentStep > 1 ? <Check className="h-3 w-3" /> : 1}
              </div>
              <span className={currentStep >= 1 ? 'font-medium' : 'text-muted-foreground'}>
                Domain
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
                {currentStep > 2 ? <Check className="h-3 w-3" /> : 2}
              </div>
              <span className={currentStep >= 2 ? 'font-medium' : 'text-muted-foreground'}>
                Hosting
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}>
                {deploymentStatus === 'success' ? <Check className="h-3 w-3" /> : 3}
              </div>
              <span className={currentStep >= 3 ? 'font-medium' : 'text-muted-foreground'}>
                Settings
              </span>
            </div>
          </div>
          <Progress value={(currentStep / 3) * 100} className="h-1" />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Step 1: Domain Configuration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Domain Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Choose how users will access your website
              </p>
            </div>
            
            <Tabs defaultValue="subdomain">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="subdomain">Free Subdomain</TabsTrigger>
                <TabsTrigger value="custom">Custom Domain</TabsTrigger>
              </TabsList>
              
              <TabsContent value="subdomain" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      value={settings.subdomain}
                      onChange={(e) => setSettings({ ...settings, subdomain: e.target.value })}
                      placeholder="yourwebsite"
                      className="rounded-r-none"
                    />
                    <div className="flex items-center bg-muted px-3 rounded-r-md border border-l-0 border-input">
                      .example.com
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose a subdomain for your website. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Globe className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Free Subdomain</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Deploy your website with a free subdomain on our servers. 
                        Perfect for personal projects, portfolios, and testing.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="domainName">Custom Domain</Label>
                  <Input
                    id="domainName"
                    value={settings.domainName}
                    onChange={(e) => setSettings({ ...settings, domainName: e.target.value })}
                    placeholder="example.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a domain you already own. You'll need to update your DNS settings.
                  </p>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-600">Custom Domain Notice</h4>
                      <p className="text-sm mt-1">
                        Custom domains are only available with Standard and Premium hosting plans.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium">DNS Configuration</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    After deployment, you'll need to add these records to your domain:
                  </p>
                  <div className="bg-background p-3 rounded-md text-xs font-mono">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span>Name</span>
                      <span>Value</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>A</span>
                      <span>@</span>
                      <span>192.0.2.1</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span>CNAME</span>
                      <span>www</span>
                      <span>example.com</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Step 2: Hosting Plan */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Choose a Hosting Plan</h3>
              <p className="text-sm text-muted-foreground">
                Select the right hosting plan for your needs
              </p>
            </div>
            
            <RadioGroup
              value={settings.hostingPlan}
              onValueChange={(value) =>
                setSettings({ ...settings, hostingPlan: value as DeploySettings['hostingPlan'] })
              }
              className="grid gap-4 md:grid-cols-3"
            >
              {plans.map((plan) => (
                <div key={plan.id} className="relative">
                  <RadioGroupItem
                    value={plan.id}
                    id={`plan-${plan.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`plan-${plan.id}`}
                    className="cursor-pointer"
                  >
                    <Card className={`h-full ${
                      settings.hostingPlan === plan.id
                        ? 'ring-2 ring-primary'
                        : 'hover:border-primary/50'
                    }`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          {plan.isRecommended && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{plan.price}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Storage</span>
                            <span className="font-medium">{plan.storage}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Bandwidth</span>
                            <span className="font-medium">{plan.bandwidth}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Features</h4>
                          <ul className="space-y-2">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-sm">
                                <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        {/* Step 3: Advanced Settings */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Website Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure security and performance settings
              </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Security</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sslEnabled">SSL Certificate</Label>
                      <p className="text-xs text-muted-foreground">Enable HTTPS for your website</p>
                    </div>
                    <Switch
                      id="sslEnabled"
                      checked={settings.sslEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, sslEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="passwordProtection">Password Protection</Label>
                      <p className="text-xs text-muted-foreground">Restrict access with a password</p>
                    </div>
                    <Switch
                      id="passwordProtection"
                      checked={settings.advancedSettings.passwordProtection}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          advancedSettings: {
                            ...settings.advancedSettings,
                            passwordProtection: checked,
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="caching">Browser Caching</Label>
                      <p className="text-xs text-muted-foreground">Improve loading speed for returning visitors</p>
                    </div>
                    <Switch
                      id="caching"
                      checked={settings.advancedSettings.caching}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          advancedSettings: {
                            ...settings.advancedSettings,
                            caching: checked,
                          },
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="cdnEnabled">CDN Distribution</Label>
                      <p className="text-xs text-muted-foreground">Distribute content globally for faster loading</p>
                    </div>
                    <Switch
                      id="cdnEnabled"
                      checked={settings.advancedSettings.cdnEnabled}
                      onCheckedChange={(checked) =>
                        setSettings({
                          ...settings,
                          advancedSettings: {
                            ...settings.advancedSettings,
                            cdnEnabled: checked,
                          },
                        })
                      }
                      disabled={settings.hostingPlan === 'basic'}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Analytics & Backups</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Website Analytics</Label>
                    <p className="text-xs text-muted-foreground">Track visitor statistics and behavior</p>
                  </div>
                  <Switch
                    id="analytics"
                    checked={settings.analytics}
                    onCheckedChange={(checked) => setSettings({ ...settings, analytics: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="backups">Automated Backups</Label>
                    <p className="text-xs text-muted-foreground">
                      Regular backups of your website {settings.hostingPlan !== 'basic' ? '(daily)' : ''}
                    </p>
                  </div>
                  <Switch
                    id="backups"
                    checked={settings.backups}
                    onCheckedChange={(checked) => setSettings({ ...settings, backups: checked })}
                    disabled={settings.hostingPlan === 'basic'}
                  />
                </div>
              </CardContent>
            </Card>
            
            {settings.advancedSettings.customHeadersEnabled && (
              <div className="space-y-2">
                <Label htmlFor="customHeaders">Custom HTTP Headers</Label>
                <Input
                  id="customHeaders"
                  value={settings.advancedSettings.customHeaders}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      advancedSettings: {
                        ...settings.advancedSettings,
                        customHeaders: e.target.value,
                      },
                    })
                  }
                  placeholder="Content-Security-Policy: default-src 'self'"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom HTTP headers for your website (one per line)
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Deployment Status */}
        {deploymentStatus === 'deploying' && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <h3 className="font-medium">Deploying your website...</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deployment Progress</span>
                <span>{Math.round(deploymentProgress)}%</span>
              </div>
              <Progress value={deploymentProgress} className="h-2" />
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Building website files</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Creating hosting environment</span>
              </div>
              <div className="flex items-center gap-2">
                {deploymentProgress > 50 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                <span>Uploading website assets</span>
              </div>
              <div className="flex items-center gap-2">
                {deploymentProgress > 80 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : deploymentProgress > 50 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span>Configuring DNS settings</span>
              </div>
              <div className="flex items-center gap-2">
                {deploymentProgress === 100 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : deploymentProgress > 80 ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <div className="h-4 w-4" />
                )}
                <span>Finalizing deployment</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Deployment Success */}
        {deploymentStatus === 'success' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-medium">Deployment Successful!</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Your website has been successfully deployed and is now live.
              </p>
              
              <div className="p-4 w-full bg-muted/30 rounded-lg flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-2">Your website is available at:</p>
                <a
                  href={deploymentUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-primary flex items-center"
                >
                  {deploymentUrl}
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Next Steps</h4>
              <ul className="space-y-2">
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Configure your custom domain in your domain registrar's DNS settings</span>
                </li>
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Set up your website analytics dashboard</span>
                </li>
                <li className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Share your new website with the world</span>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Deployment Error */}
        {deploymentStatus === 'error' && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-medium">Deployment Failed</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                We encountered an error while deploying your website.
              </p>
              
              <div className="p-4 w-full bg-red-500/10 border border-red-500/20 rounded-lg text-left">
                <h4 className="font-medium text-red-600">Error Details</h4>
                <p className="text-sm mt-1">
                  There was an issue connecting to our deployment servers. Please try again later
                  or contact support if the problem persists.
                </p>
              </div>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Troubleshooting Steps</h4>
              <ul className="space-y-2">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                  <span>Check your internet connection and try again</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                  <span>Verify that all required fields are filled correctly</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                  <span>Contact our support team for assistance</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-between border-t px-6 py-4">
        {currentStep > 1 && deploymentStatus === 'idle' ? (
          <Button variant="outline" onClick={handlePreviousStep}>
            Back
          </Button>
        ) : (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        
        {deploymentStatus === 'idle' ? (
          <Button 
            onClick={handleNextStep} 
            disabled={!canProceed()} 
          >
            {currentStep < 3 ? 'Continue' : 'Deploy Website'}
          </Button>
        ) : deploymentStatus === 'deploying' ? (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deploying...
          </Button>
        ) : deploymentStatus === 'success' ? (
          <Button onClick={onCancel}>
            Done
          </Button>
        ) : (
          <Button onClick={() => setDeploymentStatus('idle')}>
            Try Again
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
