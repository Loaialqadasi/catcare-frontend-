'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Cat, MapPin, Calendar, Pencil, Trash2, Loader2, ImagePlus, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCats, updateCat, deleteCat, restoreCat } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Cat as CatType, HealthStatus, OwnershipTag, CatFilters } from '@/lib/types';

const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  healthy: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', label: 'Healthy' },
  needs_attention: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-950/40', label: 'Needs Attention' },
  injured: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-950/40', label: 'Injured' },
  unknown: { color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-950/40', label: 'Unknown' },
};

const ownershipLabels: Record<string, string> = {
  stray: 'Stray',
  adopted: 'Adopted',
  campus_managed: 'Campus Cat',
  unknown: 'Unknown',
};

export default function AdminCatsPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const [cats, setCats] = useState<CatType[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthFilter, setHealthFilter] = useState<HealthStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<CatType | null>(null);
  const [editForm, setEditForm] = useState({
    nickname: '',
    description: '',
    locationName: '',
    latitude: '',
    longitude: '',
    healthStatus: 'unknown' as HealthStatus,
    ownershipTag: 'stray' as OwnershipTag,
  });
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CatType | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Restore dialog state
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<CatType | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Show deleted cats toggle
  const [showDeleted, setShowDeleted] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
    }
  }, [user, router, isAdmin]);

  const loadData = useCallback(async () => {
    try {
      const filters: CatFilters = {
        pageSize: 100,
        healthStatus: healthFilter || undefined,
      };
      const res = await fetchCats(filters);
      setCats(res.items);
    } catch {
      toast.error('Failed to load cats');
    } finally {
      setLoading(false);
    }
  }, [healthFilter]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [loadData, isAdmin]);

  if (!isAdmin) return null;

  // Filter cats by search query
  const filteredCats = cats.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cat.nickname.toLowerCase().includes(q) ||
      cat.locationName.toLowerCase().includes(q) ||
      (cat.description?.toLowerCase().includes(q) ?? false)
    );
  });

  // --- Edit handlers ---
  const openEditDialog = (cat: CatType) => {
    setEditCat(cat);
    setEditForm({
      nickname: cat.nickname,
      description: cat.description || '',
      locationName: cat.locationName,
      latitude: cat.latitude != null ? String(cat.latitude) : '',
      longitude: cat.longitude != null ? String(cat.longitude) : '',
      healthStatus: cat.healthStatus,
      ownershipTag: cat.ownershipTag,
    });
    setEditPhoto(null);
    setEditPhotoPreview(cat.photoUrl || null);
    setEditDialogOpen(true);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5 MB.');
      return;
    }
    setEditPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async () => {
    if (!editCat) return;
    if (!editForm.nickname.trim()) {
      toast.error('Nickname is required');
      return;
    }
    if (!editForm.locationName.trim()) {
      toast.error('Location name is required');
      return;
    }
    setEditing(true);
    try {
      const updateData: any = {
        nickname: editForm.nickname.trim(),
        description: editForm.description.trim() || null,
        locationName: editForm.locationName.trim(),
        healthStatus: editForm.healthStatus,
        ownershipTag: editForm.ownershipTag,
      };
      if (editForm.latitude) updateData.latitude = parseFloat(editForm.latitude);
      if (editForm.longitude) updateData.longitude = parseFloat(editForm.longitude);
      if (editPhoto) {
        updateData.photo = editPhoto;
      } else if (!editPhotoPreview && editCat.photoUrl) {
        updateData.photoUrl = null; // Photo was removed
      }

      const updated = await updateCat(editCat.id, updateData);
      setCats((prev) => prev.map((c) => (c.id === editCat.id ? updated : c)));
      toast.success('Cat updated successfully');
      setEditDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update cat');
    } finally {
      setEditing(false);
    }
  };

  // --- Delete handlers ---
  const openDeleteDialog = (cat: CatType) => {
    setDeleteTarget(cat);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCat = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCat(deleteTarget.id);
      setCats((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success('Cat deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete cat');
    } finally {
      setDeleting(false);
    }
  };

  // --- Restore handlers ---
  const openRestoreDialog = (cat: CatType) => {
    setRestoreTarget(cat);
    setRestoreDialogOpen(true);
  };

  const handleRestoreCat = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      const restored = await restoreCat(restoreTarget.id);
      setCats((prev) => prev.map((c) => (c.id === restoreTarget.id ? restored : c)));
      toast.success('Cat restored successfully');
      setRestoreDialogOpen(false);
      setRestoreTarget(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to restore cat');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground">Cat Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search cats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm w-[180px]"
            />
          </div>
          <Select value={healthFilter} onValueChange={(v) => { setHealthFilter(v === 'all' ? '' : (v as HealthStatus)); setLoading(true); }}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder="Filter by health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="needs_attention">Needs Attention</SelectItem>
              <SelectItem value="injured">Injured</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredCats.length === 0 ? (
        <Card className="rounded-xl border-border/50">
          <CardContent className="py-16 text-center">
            <Cat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No cats found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCats.map((cat) => {
            const health = healthConfig[cat.healthStatus] ?? healthConfig.unknown;
            return (
              <Card
                key={cat.id}
                className="rounded-xl border-border/50 hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted cursor-pointer" onClick={() => router.push(`/cats/${cat.id}`)}>
                      <img
                        src={cat.photoUrl || 'https://placecats.com/millie/400/300'}
                        alt={cat.nickname}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placecats.com/millie/400/300';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/cats/${cat.id}`)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{cat.nickname}</span>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5', health.bgColor, health.color)}>
                          {health.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {ownershipLabels[cat.ownershipTag]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{cat.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{cat.locationName}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(cat.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(cat)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit Cat"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openDeleteDialog(cat)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete Cat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Cat Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cat</DialogTitle>
            <DialogDescription>Update the cat&apos;s information. All changes are saved immediately.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editNickname">Nickname *</Label>
              <Input
                id="editNickname"
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                disabled={editing}
              />
            </div>
            <div className="space-y-2">
              <Label>Photo</Label>
              <input
                ref={editFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleEditPhotoChange}
                className="hidden"
                disabled={editing}
              />
              {editPhotoPreview ? (
                <div className="relative inline-block">
                  <img src={editPhotoPreview} alt="Preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => { setEditPhoto(null); setEditPhotoPreview(null); if (editFileInputRef.current) editFileInputRef.current.value = ''; }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    disabled={editing}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 h-20 w-full rounded-lg border-2 border-dashed border-border hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                  disabled={editing}
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload photo</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLocation">Location Name *</Label>
              <Input
                id="editLocation"
                value={editForm.locationName}
                onChange={(e) => setEditForm({ ...editForm, locationName: e.target.value })}
                disabled={editing}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editLat" className="text-xs">Latitude</Label>
                <Input
                  id="editLat"
                  type="number"
                  step="any"
                  placeholder="1.5595"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm({ ...editForm, latitude: e.target.value })}
                  disabled={editing}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editLng" className="text-xs">Longitude</Label>
                <Input
                  id="editLng"
                  type="number"
                  step="any"
                  placeholder="103.6388"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value })}
                  disabled={editing}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select value={editForm.healthStatus} onValueChange={(v) => setEditForm({ ...editForm, healthStatus: v as HealthStatus })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="healthy">Healthy</SelectItem>
                    <SelectItem value="needs_attention">Needs Attention</SelectItem>
                    <SelectItem value="injured">Injured</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ownership Tag</Label>
                <Select value={editForm.ownershipTag} onValueChange={(v) => setEditForm({ ...editForm, ownershipTag: v as OwnershipTag })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stray">Stray</SelectItem>
                    <SelectItem value="adopted">Adopted</SelectItem>
                    <SelectItem value="campus_managed">Campus Managed</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editing}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={editing} className="bg-amber-500 hover:bg-amber-600 text-white">
              {editing ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving...</span> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Cat Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Cat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.nickname}</strong>? The cat will be soft-deleted and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Cancel</Button>
            <Button onClick={handleDeleteCat} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
              {deleting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Deleting...</span> : 'Delete Cat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Cat Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Cat</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore <strong>{restoreTarget?.nickname}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)} disabled={restoring}>Cancel</Button>
            <Button onClick={handleRestoreCat} disabled={restoring} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {restoring ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Restoring...</span> : 'Restore Cat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
