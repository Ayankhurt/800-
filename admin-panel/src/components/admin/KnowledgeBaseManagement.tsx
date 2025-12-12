'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { adminService, KnowledgeBaseArticle, KnowledgeBaseCategory } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  FileText,
  BarChart3,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export default function KnowledgeBaseManagement() {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [categories, setCategories] = useState<KnowledgeBaseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArticleDialog, setShowArticleDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [editingCategory, setEditingCategory] = useState<KnowledgeBaseCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [articleFormData, setArticleFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    scheduled_publish_at: '',
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const [articlesResponse, categoriesResponse] = await Promise.all([
        adminService.getKnowledgeBaseArticles(params),
        adminService.getKnowledgeBaseCategories(),
      ]);

      if (articlesResponse.success) {
        setArticles(articlesResponse.data.articles || []);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data.categories || []);
      }
    } catch (error: any) {
      toast.error('Failed to load knowledge base data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!articleFormData.title.trim() || !articleFormData.content.trim() || !articleFormData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await adminService.createKnowledgeBaseArticle(articleFormData);
      if (response.success) {
        toast.success('Article created');
        setShowArticleDialog(false);
        resetArticleForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to create article');
    }
  };

  const handleUpdateArticle = async () => {
    if (!editingArticle || !articleFormData.title.trim() || !articleFormData.content.trim()) {
      return;
    }

    try {
      const response = await adminService.updateKnowledgeBaseArticle(editingArticle.id, articleFormData);
      if (response.success) {
        toast.success('Article updated');
        setEditingArticle(null);
        resetArticleForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to update article');
    }
  };

  const handleDeleteArticle = async (article: KnowledgeBaseArticle) => {
    if (!confirm(`Delete article "${article.title}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteKnowledgeBaseArticle(article.id);
      if (response.success) {
        toast.success('Article deleted');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to delete article');
    }
  };

  const handleViewAnalytics = async (article: KnowledgeBaseArticle) => {
    try {
      const response = await adminService.getKnowledgeBaseArticleAnalytics(article.id);
      if (response.success) {
        const analytics = response.data;
        alert(
          `Article Analytics:\n\n` +
          `Views: ${article.view_count}\n` +
          `Helpful: ${article.helpful_count}\n` +
          `Not Helpful: ${article.not_helpful_count}\n` +
          `Helpfulness Rate: ${article.view_count > 0 ? ((article.helpful_count / article.view_count) * 100).toFixed(1) : 0}%`
        );
      }
    } catch (error: any) {
      toast.error('Failed to load analytics');
    }
  };

  const handleCreateCategory = async () => {
    if (!categoryFormData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      const response = await adminService.createKnowledgeBaseCategory(categoryFormData);
      if (response.success) {
        toast.success('Category created');
        setShowCategoryDialog(false);
        resetCategoryForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !categoryFormData.name.trim()) {
      return;
    }

    try {
      const response = await adminService.updateKnowledgeBaseCategory(editingCategory.id, categoryFormData);
      if (response.success) {
        toast.success('Category updated');
        setEditingCategory(null);
        resetCategoryForm();
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (category: KnowledgeBaseCategory) => {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    try {
      const response = await adminService.deleteKnowledgeBaseCategory(category.id);
      if (response.success) {
        toast.success('Category deleted');
        loadData();
      }
    } catch (error: any) {
      toast.error('Failed to delete category');
    }
  };

  const resetArticleForm = () => {
    setArticleFormData({
      title: '',
      content: '',
      category: '',
      tags: [],
      status: 'draft',
      scheduled_publish_at: '',
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      parent_id: '',
    });
  };

  const openEditArticle = (article: KnowledgeBaseArticle) => {
    setEditingArticle(article);
    setArticleFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || [],
      status: article.status as 'draft' | 'published',
      scheduled_publish_at: article.scheduled_publish_at || '',
    });
    setShowArticleDialog(true);
  };

  const openEditCategory = (category: KnowledgeBaseCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
    });
    setShowCategoryDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-500' },
      published: { label: 'Published', className: 'bg-green-500' },
      archived: { label: 'Archived', className: 'bg-orange-500' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Knowledge Base Management</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Create and manage help articles
          </p>
        </div>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadData()}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => {
              resetArticleForm();
              setEditingArticle(null);
              setShowArticleDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Article
            </Button>
          </div>

          {/* Articles Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Views</TableHead>
                    <TableHead className="hidden lg:table-cell">Helpfulness</TableHead>
                    <TableHead className="hidden lg:table-cell">Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        No articles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-semibold">{article.title}</TableCell>
                        <TableCell>{article.category_name || article.category}</TableCell>
                        <TableCell>{getStatusBadge(article.status)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {article.view_count.toLocaleString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {article.view_count > 0
                            ? `${((article.helpful_count / article.view_count) * 100).toFixed(1)}%`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {format(new Date(article.updated_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAnalytics(article)}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditArticle(article)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteArticle(article)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              resetCategoryForm();
              setEditingCategory(null);
              setShowCategoryDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          </div>

          {/* Categories Table */}
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden md:table-cell">Articles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-semibold">{category.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {category.article_count || 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditCategory(category)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Article Dialog */}
      <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Edit Article' : 'Create Article'}
            </DialogTitle>
            <DialogDescription>
              {editingArticle ? 'Update knowledge base article' : 'Create a new knowledge base article'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={articleFormData.title}
                onChange={(e) => setArticleFormData({ ...articleFormData, title: e.target.value })}
                placeholder="Enter article title"
              />
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={articleFormData.content}
                onChange={(e) => setArticleFormData({ ...articleFormData, content: e.target.value })}
                placeholder="Enter article content (supports markdown)"
                rows={12}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={articleFormData.category}
                  onValueChange={(value) => setArticleFormData({ ...articleFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={articleFormData.status}
                  onValueChange={(value: any) => setArticleFormData({ ...articleFormData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scheduled Publish (optional)</Label>
              <Input
                type="datetime-local"
                value={articleFormData.scheduled_publish_at}
                onChange={(e) => setArticleFormData({ ...articleFormData, scheduled_publish_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowArticleDialog(false);
                resetArticleForm();
                setEditingArticle(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingArticle ? handleUpdateArticle : handleCreateArticle}>
              {editingArticle ? 'Update' : 'Create'} Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category' : 'Create a new category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Enter category name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryDialog(false);
                resetCategoryForm();
                setEditingCategory(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


