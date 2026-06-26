'use client';

// Loai Rafaat — CCU-S1-02 | Cat Management Module

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2, ImagePlus, X, MapPin } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCat } from '@/lib/api-client';
import { toast } from 'sonner';
import type { HealthStatus, OwnershipTag } from '@/lib/types';
import dynamic from 'next/dynamic';

// Load LocationPicker only on the client (Leaflet requires window)
const LocationPickerLazy = dynamic(
  () => import('@/components/map/location-picker').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[350px] flex items-center justify-center bg-muted/30 rounded-lg border border-border">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);


export function CreateCatForm() {
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('unknown');
  const [ownershipTag, setOwnershipTag] = useState<OwnershipTag>('stray');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill coordinates if the user came from the map page (clicked "Add cat at this pin")
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat) setLatitude(lat);
    if (lng) setLongitude(lng);
  }, [searchParams]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate file size (5 MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5 MB.');
      return;
    }

    setPhoto(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    if (!nickname.trim()) {
      toast.error('Please enter a nickname for the cat');
      return false;
    }
    if (nickname.trim().length < 2) {
      toast.error('Nickname must be at least 2 characters');
      return false;
    }
    if (!description.trim()) {
      toast.error('Please provide a description');
      return false;
    }
    if (!locationName.trim()) {
      toast.error('Please enter the location');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setUploadProgress(0);
    try {
      // Simulate upload progress since fetch doesn't support progress events
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90; }
          return prev + Math.random() * 15;
        });
      }, 300);

      const newCat = await createCat({
        nickname: nickname.trim(),
        description: description.trim(),
        photo: photo ?? undefined,
        locationName: locationName.trim(),
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        healthStatus,
        ownershipTag,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('Cat registered!', { description: `${newCat.nickname} has been added to the system` });
      router.push(`/cats/${newCat.id}`);
    } catch (err) {
      setUploadProgress(0);
      toast.error('Failed to create cat', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in-up">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/cats')}
        className="text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go Back
      </Button>

      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">Register New Cat</CardTitle>
          <CardDescription>
            Add a new campus cat to the management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">Cat Nickname *</Label>
              <Input
                id="nickname"
                placeholder="e.g., Whiskers, Luna, Mochi"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the cat's appearance, behavior, and any special notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                disabled={submitting}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <input
                ref={fileInputRef}
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={submitting}
              />
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-40 w-40 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    disabled={submitting}
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {photo && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-[10rem]">
                      {photo.name}
                    </p>
                  )}
                  {submitting && (
                    <div className="mt-2 w-full max-w-[10rem]">
                      <p className="text-xs text-muted-foreground mb-1">Uploading photo...</p>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 h-32 w-full rounded-lg border-2 border-dashed border-border hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                  disabled={submitting}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload a photo
                  </span>
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG, or WebP — max 5 MB. Optional.
              </p>
            </div>

            {/* Location Name */}
            <div className="space-y-2">
              <Label htmlFor="location">Location Name *</Label>
              <Input
                id="location"
                placeholder="e.g., Engineering Faculty, Block E"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Tip: pick a location on the map below — this field will auto-fill from the place name.
              </p>
            </div>

            {/* Interactive Map Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                Pick location on map
              </Label>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the map to drop a pin, search for a real place in UTM, or pick from campus buildings.
              </p>
              <LocationPickerLazy
                latitude={latitude}
                longitude={longitude}
                locationName={locationName}
                onLocationChange={(lat, lng, name) => {
                  setLatitude(lat);
                  setLongitude(lng);
                  // Auto-fill the location name from the picked place
                  if (name && name.trim()) {
                    setLocationName(name.split(',')[0].trim());
                  }
                }}
              />
              {/* Show current coordinates */}
              {(latitude || longitude) && (
                <div className="text-xs text-muted-foreground font-mono">
                  Lat: {latitude || '—'} · Lng: {longitude || '—'}
                </div>
              )}
            </div>

            {/* Health Status & Ownership */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Health Status</Label>
                <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as HealthStatus)}>
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
                <Select value={ownershipTag} onValueChange={(v) => setOwnershipTag(v as OwnershipTag)}>
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

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/cats')}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-medium"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Register Cat
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
