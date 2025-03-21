import { useState } from 'react';
import { Check, Layout, Globe, ShoppingCart, PenTool, Briefcase, Users, GraduationCap, BookOpen, Heart, Camera } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'business' | 'blog' | 'portfolio' | 'e-commerce' | 'educational' | 'nonprofit' | 'landing';
  previewImage: string;
  features: string[];
  isPremium?: boolean;
}

interface TemplateSelectorProps {
  templates: WebsiteTemplate[];
  onSelectTemplate: (template: WebsiteTemplate) => void;
}

export function TemplateSelector({ templates, onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleSelectTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onSelectTemplate(template);
    }
  };

  const categorizedTemplates = {
    all: templates,
    personal: templates.filter(t => t.category === 'personal'),
    business: templates.filter(t => t.category === 'business'),
    blog: templates.filter(t => t.category === 'blog'),
    portfolio: templates.filter(t => t.category === 'portfolio'),
    'e-commerce': templates.filter(t => t.category === 'e-commerce'),
    educational: templates.filter(t => t.category === 'educational'),
    nonprofit: templates.filter(t => t.category === 'nonprofit'),
    landing: templates.filter(t => t.category === 'landing'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <Users className="h-4 w-4" />;
      case 'business':
        return <Briefcase className="h-4 w-4" />;
      case 'blog':
        return <BookOpen className="h-4 w-4" />;
      case 'portfolio':
        return <PenTool className="h-4 w-4" />;
      case 'e-commerce':
        return <ShoppingCart className="h-4 w-4" />;
      case 'educational':
        return <GraduationCap className="h-4 w-4" />;
      case 'nonprofit':
        return <Heart className="h-4 w-4" />;
      case 'landing':
        return <Globe className="h-4 w-4" />;
      default:
        return <Layout className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>Choose a Website Template</CardTitle>
          <CardDescription>
            Select a template as the foundation for your new website. You can customize it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="all" 
            value={activeCategory}
            onValueChange={setActiveCategory}
          >
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <TabsList className="w-max px-4 py-2">
                <TabsTrigger value="all" className="gap-1">
                  <Layout className="h-4 w-4" /> All
                </TabsTrigger>
                <TabsTrigger value="personal" className="gap-1">
                  <Users className="h-4 w-4" /> Personal
                </TabsTrigger>
                <TabsTrigger value="business" className="gap-1">
                  <Briefcase className="h-4 w-4" /> Business
                </TabsTrigger>
                <TabsTrigger value="blog" className="gap-1">
                  <BookOpen className="h-4 w-4" /> Blog
                </TabsTrigger>
                <TabsTrigger value="portfolio" className="gap-1">
                  <PenTool className="h-4 w-4" /> Portfolio
                </TabsTrigger>
                <TabsTrigger value="e-commerce" className="gap-1">
                  <ShoppingCart className="h-4 w-4" /> E-Commerce
                </TabsTrigger>
                <TabsTrigger value="educational" className="gap-1">
                  <GraduationCap className="h-4 w-4" /> Educational
                </TabsTrigger>
                <TabsTrigger value="nonprofit" className="gap-1">
                  <Heart className="h-4 w-4" /> Nonprofit
                </TabsTrigger>
                <TabsTrigger value="landing" className="gap-1">
                  <Globe className="h-4 w-4" /> Landing Page
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            {Object.entries(categorizedTemplates).map(([category, templateList]) => (
              <TabsContent key={category} value={category} className="pt-4">
                <RadioGroup 
                  value={selectedTemplateId || ''} 
                  onValueChange={setSelectedTemplateId}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {templateList.map((template) => (
                    <div key={template.id} className="relative">
                      <RadioGroupItem
                        id={template.id}
                        value={template.id}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={template.id}
                        className="cursor-pointer"
                      >
                        <Card
                          className={`h-full overflow-hidden transition-all ${
                            selectedTemplateId === template.id
                              ? 'ring-2 ring-primary'
                              : 'hover:border-primary/50'
                          }`}
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <img
                              src={template.previewImage || '/placeholder-website.png'}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                            {template.isPremium && (
                              <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-md">
                                Premium
                              </div>
                            )}
                          </div>
                          <CardHeader className="p-3 pb-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-sm">{template.name}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {template.description}
                                </CardDescription>
                              </div>
                              <div className="flex items-center justify-center rounded-full w-5 h-5 border text-xs">
                                {getCategoryIcon(template.category)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardFooter className="p-3 pt-2">
                            <div className="flex items-center text-muted-foreground text-xs space-x-2">
                              <span className="flex items-center">
                                <Check className="mr-1 h-3 w-3" />
                                {template.features.length} features
                              </span>
                            </div>
                            {selectedTemplateId === template.id && (
                              <Check className="h-4 w-4 ml-auto text-primary" />
                            )}
                          </CardFooter>
                        </Card>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                
                {templateList.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Camera className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                    <h3 className="text-lg font-medium">No templates found</h3>
                    <p className="text-muted-foreground mt-1">
                      There are currently no templates in this category
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button
            onClick={handleSelectTemplate}
            disabled={!selectedTemplateId}
            className="ml-auto"
          >
            Continue with Selected Template
          </Button>
        </CardFooter>
      </Card>
      
      {selectedTemplateId && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Selected Template</CardTitle>
            <CardDescription>
              {templates.find(t => t.id === selectedTemplateId)?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/2">
                <img
                  src={templates.find(t => t.id === selectedTemplateId)?.previewImage || '/placeholder-website.png'}
                  alt="Selected Template Preview"
                  className="w-full rounded-md border"
                />
              </div>
              <div className="md:w-1/2 space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Template Features</h4>
                  <ul className="space-y-2">
                    {templates
                      .find(t => t.id === selectedTemplateId)
                      ?.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
