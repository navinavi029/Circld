import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Item } from '../types/item';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Dropdown } from '../components/ui/Dropdown';
import { PageTransition } from '../components/PageTransition';
import { uploadToCloudinary } from '../utils/cloudinary';
import { getPageTitleClasses, getPageContainerClasses } from '../styles/designSystem';
import { usePageTitle } from '../hooks/usePageTitle';

const CATEGORIES = [
  'Electronics',
  'Furniture',
  'Books',
  'Clothing',
  'Sports & Outdoors',
  'Home & Garden',
  'Toys & Games',
  'Tools',
  'Kitchen',
  'Other'
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select a category' },
  ...CATEGORIES.map(cat => ({ value: cat, label: cat }))
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New - Never used, in original packaging' },
  { value: 'like-new', label: 'Like New - Barely used, excellent condition' },
  { value: 'good', label: 'Good - Used with minor wear' },
  { value: 'fair', label: 'Fair - Used with noticeable wear' },
  { value: 'poor', label: 'Poor - Heavily used, may need repairs' },
];

export function EditItem() {
  usePageTitle('Edit Item');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('good');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (id && user) {
      loadItem();
    }
  }, [id, user]);

  const loadItem = async () => {
    if (!id || !user) return;
    
    try {
      const itemDoc = await getDoc(doc(db, 'items', id));
      
      if (!itemDoc.exists()) {
        setError('Item not found');
        setLoading(false);
        return;
      }
      
      const itemData = { id: itemDoc.id, ...itemDoc.data() } as Item;
      
      // Check ownership
      if (itemData.ownerId !== user.uid) {
        setError('You do not have permission to edit this item');
        setLoading(false);
        return;
      }
      
      setItem(itemData);
      setTitle(itemData.title);
      setDescription(itemData.description);
      setCategory(itemData.category);
      setCondition(itemData.condition);
      setExistingImages(itemData.images || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
      setLoading(false);
    }
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) {
      setError('Please add at least 1 photo of your item');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (const image of newImages) {
        const result = await uploadToCloudinary(image);
        newImageUrls.push(result.url);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Update item
      await updateDoc(doc(db, 'items', id), {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        images: allImages,
        updatedAt: serverTimestamp()
      });

      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
      setSaving(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/listings/${id}`);
  };

  if (loading) {
    return (
      <div className="flex-1 w-full flex justify-center items-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-text-secondary dark:text-gray-400">
          <div className="w-6 h-6 border-3 border-accent/30 dark:border-primary-light/30 border-t-accent dark:border-t-primary-light rounded-full animate-spin"></div>
          <span>Loading item...</span>
        </div>
      </div>
    );
  }

  if (error && !item) {
    return (
      <PageTransition variant="page">
        <div className={getPageContainerClasses()}>
          <Alert variant="error" className="mb-6">{error}</Alert>
          <Button onClick={() => navigate(`/listings/${id}`)} variant="outline">
            Back to Item
          </Button>
        </div>
      </PageTransition>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <PageTransition variant="page">
      <div className="flex-1 w-full">
        <div className={getPageContainerClasses()}>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className={getPageTitleClasses()}>Edit Item</h1>
              <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">
                Update your listing details
              </p>
            </div>

            {error && <Alert variant="error" className="mb-6">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-text dark:text-gray-100 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Vintage Leather Jacket"
                  required
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-text dark:text-gray-100 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your item in detail..."
                  required
                  rows={5}
                  maxLength={5000}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-primary-light text-text dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-text dark:text-gray-100 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={category}
                  onChange={setCategory}
                  options={CATEGORY_OPTIONS}
                />
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-semibold text-text dark:text-gray-100 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <Dropdown
                  value={condition}
                  onChange={setCondition}
                  options={CONDITION_OPTIONS}
                />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold text-text dark:text-gray-100 mb-2">
                  Photos <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-text-secondary dark:text-gray-400 ml-2">
                    ({totalImages}/10 images)
                  </span>
                </label>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {existingImages.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                        <img src={url} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Images */}
                {newPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {newPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 group">
                        <img src={preview} alt={`New ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded">
                          New
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {totalImages < 10 && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-accent dark:hover:border-primary-light transition-colors bg-white/50 dark:bg-gray-800/50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-sm text-text-secondary dark:text-gray-400">
                        Click to add more photos
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleNewImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/listings/${id}`)}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || totalImages === 0}
                  className="flex-1"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeInFast">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text dark:text-gray-100 mb-2">
                  Item Updated Successfully!
                </h3>
                <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">
                  Your listing has been updated and is now live.
                </p>
                <Button
                  onClick={handleSuccessClose}
                  className="w-full"
                >
                  View Item
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
