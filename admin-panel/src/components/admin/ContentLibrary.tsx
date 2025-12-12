'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  adminService,
  TradeCategory,
  ServiceArea,
  Resource,
} from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  GripVertical,
  MapPin,
  FileText,
  Video,
  BookOpen,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import { Badge } from '../ui/badge';

export default function ContentLibrary() {
  const [activeTab, setActiveTab] = useState('categories');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Content Library</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Manage trade categories, locations, and platform resources
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="categories">Trade Categories</TabsTrigger>
          <TabsTrigger value="locations">Location Management</TabsTrigger>
          <TabsTrigger value="resources">Resource Library</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <TradeCategoriesTab />
        </TabsContent>

        <TabsContent value="locations">
          <LocationManagementTab />
        </TabsContent>

        <TabsContent value="resources">
          <ResourceLibraryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TradeCategoriesTab() {
  const [categories, setCategories] = useState<TradeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TradeCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3B82F6',
    parent_id: '',
    display_order: 0,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await adminService.getTradeCategories();
      if (response.success) {
        setCategories(response.data.categories || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await adminService.updateTradeCategory(editingCategory.id, formData);
        toast.success('Category updated');
      } else {
        await adminService.createTradeCategory(formData);
        toast.success('Category created');
      }
      setShowDialog(false);
      resetForm();
      loadCategories();
    } catch (error: any) {
      toast.error('Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminService.deleteTradeCategory(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (error: any) {
      toast.error('Failed to delete category');
    }
  };

  const handleEdit = (category: TradeCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#3B82F6',
      parent_id: category.parent_id || '',
      display_order: category.display_order || 0,
    });
    setShowDialog(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
      parent_id: '',
      display_order: 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trade Categories</CardTitle>
          <Button onClick={() => {
            resetForm();
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Icon</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    <TableCell>{category.icon || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>{category.display_order || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Icon</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Icon name or URL"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Parent Category</Label>
                <Select
                  value={formData.parent_id}
                  onValueChange={(value) => setFormData({ ...formData, parent_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories
                      .filter((c) => c.id !== editingCategory?.id)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function LocationManagementTab() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingArea, setEditingArea] = useState<ServiceArea | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    state: '',
    city: '',
    zip_codes: '',
    coverage_map: '',
  });

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const response = await adminService.getServiceAreas();
      if (response.success) {
        setAreas(response.data.areas || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load service areas');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        zip_codes: formData.zip_codes.split(',').map((z) => z.trim()).filter(Boolean),
      };
      if (editingArea) {
        await adminService.updateServiceArea(editingArea.id, data);
        toast.success('Service area updated');
      } else {
        await adminService.createServiceArea(data);
        toast.success('Service area created');
      }
      setShowDialog(false);
      resetForm();
      loadAreas();
    } catch (error: any) {
      toast.error('Failed to save service area');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service area?')) return;
    try {
      await adminService.deleteServiceArea(id);
      toast.success('Service area deleted');
      loadAreas();
    } catch (error: any) {
      toast.error('Failed to delete service area');
    }
  };

  const resetForm = () => {
    setEditingArea(null);
    setFormData({
      name: '',
      state: '',
      city: '',
      zip_codes: '',
      coverage_map: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Service Areas</CardTitle>
          <Button onClick={() => {
            resetForm();
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service Area
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Zip Codes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No service areas found
                  </TableCell>
                </TableRow>
              ) : (
                areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.state || '-'}</TableCell>
                    <TableCell>{area.city || '-'}</TableCell>
                    <TableCell>
                      {area.zip_codes?.join(', ') || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingArea(area);
                            setFormData({
                              name: area.name,
                              state: area.state || '',
                              city: area.city || '',
                              zip_codes: area.zip_codes?.join(', ') || '',
                              coverage_map: area.coverage_map || '',
                            });
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(area.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingArea ? 'Edit Service Area' : 'Create Service Area'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Zip Codes (comma-separated)</Label>
              <Input
                value={formData.zip_codes}
                onChange={(e) => setFormData({ ...formData, zip_codes: e.target.value })}
                placeholder="12345, 67890, ..."
              />
            </div>
            <div>
              <Label>Coverage Map URL</Label>
              <Input
                value={formData.coverage_map}
                onChange={(e) => setFormData({ ...formData, coverage_map: e.target.value })}
                placeholder="URL to coverage map"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingArea ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ResourceLibraryTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'article' as 'article' | 'faq' | 'video' | 'template' | 'guide',
    content: '',
    category: '',
    tags: '',
    published: false,
    scheduled_at: '',
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await adminService.getResources();
      if (response.success) {
        setResources(response.data.resources || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        scheduled_at: formData.scheduled_at || undefined,
      };
      if (editingResource) {
        await adminService.updateResource(editingResource.id, data);
        toast.success('Resource updated');
      } else {
        await adminService.createResource(data);
        toast.success('Resource created');
      }
      setShowDialog(false);
      resetForm();
      loadResources();
    } catch (error: any) {
      toast.error('Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await adminService.deleteResource(id);
      toast.success('Resource deleted');
      loadResources();
    } catch (error: any) {
      toast.error('Failed to delete resource');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'faq':
        return <HelpCircle className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'template':
        return <FileCheck className="h-4 w-4" />;
      case 'guide':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const resetForm = () => {
    setEditingResource(null);
    setFormData({
      title: '',
      type: 'article',
      content: '',
      category: '',
      tags: '',
      published: false,
      scheduled_at: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Resource Library</CardTitle>
          <Button onClick={() => {
            resetForm();
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(resource.type)}
                        <span className="capitalize">{resource.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{resource.category || '-'}</TableCell>
                    <TableCell>
                      {resource.published ? (
                        <Badge className="bg-green-500">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {resource.created_at
                        ? new Date(resource.created_at).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingResource(resource);
                            setFormData({
                              title: resource.title,
                              type: resource.type,
                              content: resource.content,
                              category: resource.category || '',
                              tags: resource.tags?.join(', ') || '',
                              published: resource.published,
                              scheduled_at: resource.scheduled_at || '',
                            });
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(resource.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Edit Resource' : 'Create Resource'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                placeholder="Enter content (supports markdown/HTML)"
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Published</Label>
                <Select
                  value={formData.published ? 'true' : 'false'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, published: value === 'true' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Draft</SelectItem>
                    <SelectItem value="true">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule Publish (optional)</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.content}>
              {editingResource ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


