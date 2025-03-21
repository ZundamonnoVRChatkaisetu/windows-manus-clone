import { useState } from 'react';
import { 
  Layout, Text, Image, Box, Grid, List, Save, EyeIcon, 
  Code, Settings, Undo, Redo, PanelLeft, PlusCircle, 
  Trash2, CornerUpLeft, 
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WebsiteTemplate } from './template-selector';

export interface WebsiteSection {
  id: string;
  type: 'hero' | 'features' | 'content' | 'gallery' | 'testimonials' | 'contact' | 'pricing' | 'footer' | 'custom';
  title: string;
  content: Record<string, any>;
  isEnabled: boolean;
}

export interface Website {
  id: string;
  name: string;
  template: WebsiteTemplate;
  sections: WebsiteSection[];
  settings: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    layout: {
      maxWidth: string;
      spacing: string;
    };
    metadata: {
      title: string;
      description: string;
      keywords: string;
    };
  };
}

interface SiteBuilderProps {
  website: Website;
  onSave: (website: Website) => void;
  onPreview: (website: Website) => void;
  onExportCode: (website: Website) => void;
}

export function SiteBuilder({
  website,
  onSave,
  onPreview,
  onExportCode,
}: SiteBuilderProps) {
  const [currentWebsite, setCurrentWebsite] = useState<Website>(website);
  const [activeTab, setActiveTab] = useState('content');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [history, setHistory] = useState<Website[]>([website]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Section management functions
  const addSection = (type: WebsiteSection['type']) => {
    const newSection: WebsiteSection = {
      id: crypto.randomUUID(),
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      content: getDefaultContentForType(type),
      isEnabled: true,
    };

    const updatedWebsite = {
      ...currentWebsite,
      sections: [...currentWebsite.sections, newSection],
    };

    updateWebsite(updatedWebsite);
    setEditingSectionId(newSection.id);
    
    toast({
      title: 'Section Added',
      description: `New ${type} section has been added to your website.`,
    });
  };

  const removeSection = (sectionId: string) => {
    const updatedWebsite = {
      ...currentWebsite,
      sections: currentWebsite.sections.filter(section => section.id !== sectionId),
    };

    updateWebsite(updatedWebsite);
    
    if (editingSectionId === sectionId) {
      setEditingSectionId(null);
    }
    
    toast({
      title: 'Section Removed',
      description: 'The section has been removed from your website.',
    });
  };

  const toggleSectionEnabled = (sectionId: string, isEnabled: boolean) => {
    const updatedWebsite = {
      ...currentWebsite,
      sections: currentWebsite.sections.map(section =>
        section.id === sectionId ? { ...section, isEnabled } : section
      ),
    };

    updateWebsite(updatedWebsite);
  };

  const updateSectionContent = (sectionId: string, contentUpdates: Record<string, any>) => {
    const updatedWebsite = {
      ...currentWebsite,
      sections: currentWebsite.sections.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, ...contentUpdates } }
          : section
      ),
    };

    updateWebsite(updatedWebsite);
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    const updatedWebsite = {
      ...currentWebsite,
      sections: currentWebsite.sections.map(section =>
        section.id === sectionId ? { ...section, title } : section
      ),
    };

    updateWebsite(updatedWebsite);
  };

  // Website settings update
  const updateWebsiteSettings = (settingsUpdates: Partial<Website['settings']>) => {
    const updatedWebsite = {
      ...currentWebsite,
      settings: {
        ...currentWebsite.settings,
        ...settingsUpdates,
      },
    };

    updateWebsite(updatedWebsite);
  };

  // History management
  const updateWebsite = (updatedWebsite: Website) => {
    // Add to history, removing any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(updatedWebsite);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentWebsite(updatedWebsite);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentWebsite(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentWebsite(history[historyIndex + 1]);
    }
  };

  // Save and export
  const handleSave = () => {
    onSave(currentWebsite);
    
    toast({
      title: 'Website Saved',
      description: 'Your website changes have been saved successfully.',
    });
  };

  const handlePreview = () => {
    onPreview(currentWebsite);
  };

  const handleExportCode = () => {
    onExportCode(currentWebsite);
  };

  // Helper functions
  const getDefaultContentForType = (type: WebsiteSection['type']): Record<string, any> => {
    switch (type) {
      case 'hero':
        return {
          heading: 'Welcome to Your Website',
          subheading: 'A beautiful, modern website built just for you',
          buttonText: 'Get Started',
          buttonUrl: '#',
          backgroundImage: '',
        };
      case 'features':
        return {
          heading: 'Features',
          subheading: 'What makes us special',
          features: [
            { title: 'Feature 1', description: 'Description for feature 1', icon: 'Zap' },
            { title: 'Feature 2', description: 'Description for feature 2', icon: 'Shield' },
            { title: 'Feature 3', description: 'Description for feature 3', icon: 'Star' },
          ],
        };
      case 'content':
        return {
          heading: 'About Us',
          content: 'This is a sample content section. Replace this with your own content.',
          image: '',
          imagePosition: 'right',
        };
      case 'gallery':
        return {
          heading: 'Our Gallery',
          images: [
            { url: '', caption: 'Image 1' },
            { url: '', caption: 'Image 2' },
            { url: '', caption: 'Image 3' },
          ],
        };
      case 'testimonials':
        return {
          heading: 'What Our Customers Say',
          testimonials: [
            { quote: 'Great service!', author: 'John Doe', role: 'CEO', avatar: '' },
            { quote: 'Love it!', author: 'Jane Smith', role: 'Designer', avatar: '' },
          ],
        };
      case 'contact':
        return {
          heading: 'Contact Us',
          address: '123 Main St, Anytown, USA',
          email: 'info@example.com',
          phone: '(123) 456-7890',
          formEnabled: true,
        };
      case 'pricing':
        return {
          heading: 'Pricing Plans',
          subheading: 'Choose the right plan for you',
          plans: [
            { title: 'Basic', price: '$9.99', features: ['Feature 1', 'Feature 2'], buttonText: 'Get Started' },
            { title: 'Pro', price: '$19.99', features: ['Feature 1', 'Feature 2', 'Feature 3'], buttonText: 'Get Started', highlighted: true },
            { title: 'Enterprise', price: '$29.99', features: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4'], buttonText: 'Get Started' },
          ],
        };
      case 'footer':
        return {
          columns: [
            { title: 'Company', links: [{ text: 'About', url: '#' }, { text: 'Contact', url: '#' }] },
            { title: 'Services', links: [{ text: 'Service 1', url: '#' }, { text: 'Service 2', url: '#' }] },
            { title: 'Legal', links: [{ text: 'Privacy', url: '#' }, { text: 'Terms', url: '#' }] },
          ],
          copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
          socialLinks: [
            { platform: 'Twitter', url: '#' },
            { platform: 'Facebook', url: '#' },
            { platform: 'Instagram', url: '#' },
          ],
        };
      case 'custom':
        return {
          html: '<div class="custom-section">Custom HTML content</div>',
          css: '.custom-section { padding: 2rem; }',
        };
      default:
        return {};
    }
  };

  const getSectionIcon = (type: WebsiteSection['type']) => {
    switch (type) {
      case 'hero':
        return <Layout className="h-4 w-4" />;
      case 'features':
        return <Grid className="h-4 w-4" />;
      case 'content':
        return <Text className="h-4 w-4" />;
      case 'gallery':
        return <Image className="h-4 w-4" />;
      case 'testimonials':
        return <List className="h-4 w-4" />;
      case 'contact':
        return <Text className="h-4 w-4" />;
      case 'pricing':
        return <Box className="h-4 w-4" />;
      case 'footer':
        return <Layout className="h-4 w-4" />;
      case 'custom':
        return <Code className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  // Get the current editing section
  const currentEditingSection = editingSectionId
    ? currentWebsite.sections.find(section => section.id === editingSectionId)
    : null;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium">{currentWebsite.name}</h3>
            <p className="text-xs text-muted-foreground">Based on: {currentWebsite.template.name}</p>
          </div>
          
          <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full p-0 bg-transparent">
              <TabsTrigger value="content" className="flex-1 rounded-none data-[state=active]:bg-muted">
                Content
              </TabsTrigger>
              <TabsTrigger value="styles" className="flex-1 rounded-none data-[state=active]:bg-muted">
                Styles
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="mt-0 p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Website Name</Label>
                    <Input
                      value={currentWebsite.name}
                      onChange={(e) => updateWebsite({ ...currentWebsite, name: e.target.value })}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium">Sections</h4>
                      <Select 
                        onValueChange={(value) => {
                          if (value !== "none") {
                            addSection(value as WebsiteSection['type']);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[110px] h-7">
                          <SelectValue placeholder="Add Section" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Add Section</SelectItem>
                          <SelectItem value="hero">Hero</SelectItem>
                          <SelectItem value="features">Features</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="gallery">Gallery</SelectItem>
                          <SelectItem value="testimonials">Testimonials</SelectItem>
                          <SelectItem value="pricing">Pricing</SelectItem>
                          <SelectItem value="contact">Contact</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      {currentWebsite.sections.map((section) => (
                        <div
                          key={section.id}
                          className={`flex items-center p-2 rounded-md text-sm ${
                            editingSectionId === section.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/60 cursor-pointer'
                          }`}
                          onClick={() => setEditingSectionId(section.id)}
                        >
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="mr-2">{getSectionIcon(section.type)}</div>
                            <div className="truncate">{section.title}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={section.isEnabled}
                              onCheckedChange={(checked) => {
                                toggleSectionEnabled(section.id, checked);
                                e.stopPropagation();
                              }}
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-primary"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSection(section.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {currentWebsite.sections.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md">
                          <PlusCircle className="h-8 w-8 text-muted-foreground opacity-40 mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            No sections yet. Add a section to start building your website.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="styles" className="mt-0 p-0 flex-1 flex flex-col">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <Accordion type="multiple" defaultValue={['colors', 'fonts', 'metadata']}>
                    <AccordionItem value="colors">
                      <AccordionTrigger>Colors</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="primaryColor">Primary Color</Label>
                            <div className="flex gap-2">
                              <div 
                                className="w-8 h-8 rounded-md border" 
                                style={{ backgroundColor: currentWebsite.settings.colors.primary }}
                              />
                              <Input
                                id="primaryColor"
                                value={currentWebsite.settings.colors.primary}
                                onChange={(e) => updateWebsiteSettings({
                                  colors: { ...currentWebsite.settings.colors, primary: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="secondaryColor">Secondary Color</Label>
                            <div className="flex gap-2">
                              <div 
                                className="w-8 h-8 rounded-md border" 
                                style={{ backgroundColor: currentWebsite.settings.colors.secondary }}
                              />
                              <Input
                                id="secondaryColor"
                                value={currentWebsite.settings.colors.secondary}
                                onChange={(e) => updateWebsiteSettings({
                                  colors: { ...currentWebsite.settings.colors, secondary: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="backgroundColor">Background Color</Label>
                            <div className="flex gap-2">
                              <div 
                                className="w-8 h-8 rounded-md border" 
                                style={{ backgroundColor: currentWebsite.settings.colors.background }}
                              />
                              <Input
                                id="backgroundColor"
                                value={currentWebsite.settings.colors.background}
                                onChange={(e) => updateWebsiteSettings({
                                  colors: { ...currentWebsite.settings.colors, background: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="textColor">Text Color</Label>
                            <div className="flex gap-2">
                              <div 
                                className="w-8 h-8 rounded-md border" 
                                style={{ backgroundColor: currentWebsite.settings.colors.text }}
                              />
                              <Input
                                id="textColor"
                                value={currentWebsite.settings.colors.text}
                                onChange={(e) => updateWebsiteSettings({
                                  colors: { ...currentWebsite.settings.colors, text: e.target.value }
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="fonts">
                      <AccordionTrigger>Fonts</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="headingFont">Heading Font</Label>
                            <Select
                              value={currentWebsite.settings.fonts.heading}
                              onValueChange={(value) => updateWebsiteSettings({
                                fonts: { ...currentWebsite.settings.fonts, heading: value }
                              })}
                            >
                              <SelectTrigger id="headingFont">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="bodyFont">Body Font</Label>
                            <Select
                              value={currentWebsite.settings.fonts.body}
                              onValueChange={(value) => updateWebsiteSettings({
                                fonts: { ...currentWebsite.settings.fonts, body: value }
                              })}
                            >
                              <SelectTrigger id="bodyFont">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="layout">
                      <AccordionTrigger>Layout</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="maxWidth">Max Width</Label>
                            <Select
                              value={currentWebsite.settings.layout.maxWidth}
                              onValueChange={(value) => updateWebsiteSettings({
                                layout: { ...currentWebsite.settings.layout, maxWidth: value }
                              })}
                            >
                              <SelectTrigger id="maxWidth">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sm">Small (640px)</SelectItem>
                                <SelectItem value="md">Medium (768px)</SelectItem>
                                <SelectItem value="lg">Large (1024px)</SelectItem>
                                <SelectItem value="xl">X-Large (1280px)</SelectItem>
                                <SelectItem value="2xl">2X-Large (1536px)</SelectItem>
                                <SelectItem value="full">Full Width</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="spacing">Spacing</Label>
                            <Select
                              value={currentWebsite.settings.layout.spacing}
                              onValueChange={(value) => updateWebsiteSettings({
                                layout: { ...currentWebsite.settings.layout, spacing: value }
                              })}
                            >
                              <SelectTrigger id="spacing">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tight">Tight</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="relaxed">Relaxed</SelectItem>
                                <SelectItem value="loose">Loose</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="metadata">
                      <AccordionTrigger>SEO Metadata</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
                          <div className="grid gap-2">
                            <Label htmlFor="metaTitle">Page Title</Label>
                            <Input
                              id="metaTitle"
                              value={currentWebsite.settings.metadata.title}
                              onChange={(e) => updateWebsiteSettings({
                                metadata: { ...currentWebsite.settings.metadata, title: e.target.value }
                              })}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="metaDescription">Meta Description</Label>
                            <Textarea
                              id="metaDescription"
                              rows={3}
                              value={currentWebsite.settings.metadata.description}
                              onChange={(e) => updateWebsiteSettings({
                                metadata: { ...currentWebsite.settings.metadata, description: e.target.value }
                              })}
                            />
                          </div>
                          
                          <div className="grid gap-2">
                            <Label htmlFor="metaKeywords">Keywords (comma-separated)</Label>
                            <Input
                              id="metaKeywords"
                              value={currentWebsite.settings.metadata.keywords}
                              onChange={(e) => updateWebsiteSettings({
                                metadata: { ...currentWebsite.settings.metadata, keywords: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center justify-between bg-card">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant="ghost"
              size="icon"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCode}>
              <Code className="h-4 w-4 mr-1" /> Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <EyeIcon className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>
        
        {/* Content editor area */}
        <div className="flex-1 p-4 bg-muted/30 overflow-auto">
          {currentEditingSection ? (
            <Card className="w-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getSectionIcon(currentEditingSection.type)}
                    <Input 
                      className="h-7 text-lg font-semibold"
                      value={currentEditingSection.title}
                      onChange={(e) => updateSectionTitle(currentEditingSection.id, e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSectionId(null)}
                  >
                    <CornerUpLeft className="h-4 w-4 mr-1" /> Back to Website
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section-specific editor (simplified for this implementation) */}
                <div className="bg-muted/40 p-4 rounded-lg">
                  <p className="text-sm mb-4">
                    This is a simplified section editor. In a complete implementation, 
                    there would be specific editing controls for each section type.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <Label>Section Enabled</Label>
                      <Switch
                        checked={currentEditingSection.isEnabled}
                        onCheckedChange={(checked) => toggleSectionEnabled(currentEditingSection.id, checked)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Section Type</Label>
                      <div className="flex items-center gap-2 font-medium">
                        {getSectionIcon(currentEditingSection.type)}
                        <span className="capitalize">{currentEditingSection.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Accordion type="single" collapsible defaultValue="content">
                      <AccordionItem value="content">
                        <AccordionTrigger>Content Properties</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {Object.entries(currentEditingSection.content).map(([key, value]) => (
                              <div key={key} className="grid gap-2">
                                <Label htmlFor={`content-${key}`} className="capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                </Label>
                                {typeof value === 'string' ? (
                                  key.includes('content') || key.includes('description') || key.includes('html') ? (
                                    <Textarea
                                      id={`content-${key}`}
                                      rows={4}
                                      value={value}
                                      onChange={(e) => updateSectionContent(currentEditingSection.id, { [key]: e.target.value })}
                                    />
                                  ) : (
                                    <Input
                                      id={`content-${key}`}
                                      value={value}
                                      onChange={(e) => updateSectionContent(currentEditingSection.id, { [key]: e.target.value })}
                                    />
                                  )
                                ) : typeof value === 'boolean' ? (
                                  <Switch
                                    id={`content-${key}`}
                                    checked={value}
                                    onCheckedChange={(checked) => updateSectionContent(currentEditingSection.id, { [key]: checked })}
                                  />
                                ) : (
                                  <div className="text-sm text-muted-foreground">
                                    Complex property (arrays/objects) - use the preview to check
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
                
                <div className="border p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Preview</h3>
                  <div className="bg-background p-6 rounded border min-h-[200px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl mb-4 opacity-20">{getSectionIcon(currentEditingSection.type)}</div>
                      <p className="text-lg font-medium">{currentEditingSection.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentEditingSection.isEnabled ? 'Enabled' : 'Disabled'} • {currentEditingSection.type} section
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={handlePreview}>
                        <EyeIcon className="h-4 w-4 mr-1" /> Preview Section
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <Layout className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h2 className="text-xl font-medium mb-2">Website Structure</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Select a section from the sidebar to edit its content or click the preview button to see your website.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={handlePreview}>
                    <EyeIcon className="h-4 w-4 mr-1" /> Preview Website
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('content')}>
                    <Text className="h-4 w-4 mr-1" /> Edit Content
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('styles')}>
                    <Settings className="h-4 w-4 mr-1" /> Edit Styles
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
