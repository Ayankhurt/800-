'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { adminService } from '@/src/lib/api/adminService';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Star, Award } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';

export default function PromotionalTools() {
  return (
    <Tabs defaultValue="badges" className="space-y-4">
      <TabsList>
        <TabsTrigger value="badges">Promotional Badges</TabsTrigger>
        <TabsTrigger value="featured">Featured Contractors</TabsTrigger>
      </TabsList>

      <TabsContent value="badges">
        <PromotionalBadgesTab />
      </TabsContent>

      <TabsContent value="featured">
        <FeaturedContractorsTab />
      </TabsContent>
    </Tabs>
  );
}

function PromotionalBadgesTab() {
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBadge, setEditingBadge] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    criteria: '',
    display_settings: {},
  });

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPromotionalBadges();
      if (response.success) {
        setBadges(response.data.badges || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingBadge) {
        await adminService.updatePromotionalBadge(editingBadge.id, formData);
        toast.success('Badge updated');
      } else {
        await adminService.createPromotionalBadge(formData);
        toast.success('Badge created');
      }
      setShowDialog(false);
      resetForm();
      loadBadges();
    } catch (error: any) {
      toast.error('Failed to save badge');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;
    try {
      await adminService.deletePromotionalBadge(id);
      toast.success('Badge deleted');
      loadBadges();
    } catch (error: any) {
      toast.error('Failed to delete badge');
    }
  };

  const resetForm = () => {
    setEditingBadge(null);
    setFormData({
      name: '',
      description: '',
      criteria: '',
      display_settings: {},
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Promotional Badges</CardTitle>
          <Button onClick={() => {
            resetForm();
            setShowDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Badge
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
                <TableHead>Criteria</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No badges found
                  </TableCell>
                </TableRow>
              ) : (
                badges.map((badge) => (
                  <TableRow key={badge.id}>
                    <TableCell className="font-medium">{badge.name}</TableCell>
                    <TableCell>{badge.description}</TableCell>
                    <TableCell>
                      <Badge>{badge.criteria || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBadge(badge);
                            setFormData({
                              name: badge.name,
                              description: badge.description,
                              criteria: badge.criteria || '',
                              display_settings: badge.display_settings || {},
                            });
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(badge.id)}
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
            <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
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
            <div>
              <Label>Criteria</Label>
              <Textarea
                value={formData.criteria}
                onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                rows={3}
                placeholder="Enter badge criteria..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingBadge ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function FeaturedContractorsTab() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    contractor_id: '',
    duration_days: 30,
    placement: 'homepage',
  });

  useEffect(() => {
    loadFeatured();
  }, []);

  const loadFeatured = async () => {
    try {
      setLoading(true);
      const response = await adminService.getFeaturedContractors();
      if (response.success) {
        setFeatured(response.data.contractors || response.data || []);
      }
    } catch (error: any) {
      toast.error('Failed to load featured contractors');
    } finally {
      setLoading(false);
    }
  };

  const handleFeature = async () => {
    try {
      await adminService.featureContractor(
        formData.contractor_id,
        formData.duration_days,
        formData.placement
      );
      toast.success('Contractor featured');
      setShowDialog(false);
      loadFeatured();
    } catch (error: any) {
      toast.error('Failed to feature contractor');
    }
  };

  const handleUnfeature = async (contractorId: string) => {
    try {
      await adminService.unfeatureContractor(contractorId);
      toast.success('Contractor unfeatured');
      loadFeatured();
    } catch (error: any) {
      toast.error('Failed to unfeature contractor');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Featured Contractors</CardTitle>
          <Button onClick={() => setShowDialog(true)}>
            <Star className="h-4 w-4 mr-2" />
            Feature Contractor
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
                <TableHead>Contractor</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Featured Until</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featured.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No featured contractors
                  </TableCell>
                </TableRow>
              ) : (
                featured.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.contractor?.full_name || item.contractor_id}
                    </TableCell>
                    <TableCell>{item.placement}</TableCell>
                    <TableCell>{item.duration_days} days</TableCell>
                    <TableCell>
                      {item.featured_until
                        ? new Date(item.featured_until).toLocaleDateString()
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfeature(item.contractor_id)}
                      >
                        Unfeature
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feature Contractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Contractor ID *</Label>
              <Input
                value={formData.contractor_id}
                onChange={(e) => setFormData({ ...formData, contractor_id: e.target.value })}
                placeholder="Enter contractor ID"
              />
            </div>
            <div>
              <Label>Duration (days) *</Label>
              <Input
                type="number"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({ ...formData, duration_days: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Placement</Label>
              <Input
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                placeholder="homepage, search, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeature} disabled={!formData.contractor_id}>
              Feature Contractor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}


