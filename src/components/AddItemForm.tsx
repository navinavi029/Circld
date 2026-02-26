import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { Dropdown } from './ui/Dropdown';
import { uploadToCloudinary } from '../utils/cloudinary';

interface ItemFormData {
  title: string;
  description: string;
  category: string;
  condition: string;
}

interface AddItemFormProps {
  onSuccess?: () => void;
}

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

export function AddItemForm({ onSuccess }: AddItemFormProps = {}) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    description: '',
    category: '',
    condition: 'good'
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setImages(prev => [...prev, ...files]);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (images.length === 0) {
      setError('Please add at least 1 photo of your item.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const imageUrls: string[] = [];

      for (const image of images) {
        const result = await uploadToCloudinary(image);
        imageUrls.push(result.url);
      }

      await addDoc(collection(db, 'items'), {
        ownerId: user.uid,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        images: imageUrls,
        status: 'available',
        createdAt: serverTimestamp()
      });

      setFormData({ title: '', description: '', category: '', condition: 'good' });
      setImages([]);
      setPreviews([]);
      setShowSuccessModal(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  return (
    <>
      <div>
        {error && <Alert variant="error" className="mb-4 animate-fadeInFast">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Title"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="e.g., iPhone 13 Pro, Leather Sofa, etc."
        />

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2 text-text dark:text-gray-200">
            Description <span className="text-error dark:text-error-light">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-accent dark:focus:ring-primary-light focus:border-accent dark:focus:border-primary-light transition-all duration-200 resize-none"
            placeholder="Provide details about the item's features, condition, and any other relevant information..."
          />
        </div>

        <div className="w-full">
          <Dropdown
            label="Category"
            value={formData.category}
            onChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            options={CATEGORY_OPTIONS}
            required
            placeholder="Select a category"
          />
        </div>

        <div className="w-full">
          <Dropdown
            label="Condition"
            value={formData.condition}
            onChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
            options={CONDITION_OPTIONS}
            required
            helperText="Be honest about the item's condition"
          />
        </div>

        <div>
          <label htmlFor="images" className="block text-sm font-medium mb-2 text-text dark:text-gray-200">
            Images <span className="text-error dark:text-error-light">*</span> <span className="text-text-secondary dark:text-gray-400 text-xs font-normal">(Max 5)</span>
          </label>
          <div className="relative">
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={images.length >= 5}
              className="hidden"
            />
            <label
              htmlFor="images"
              className={`
                flex flex-col items-center justify-center w-full h-32 
                border-2 border-dashed rounded-lg cursor-pointer
                transition-all duration-200
                ${images.length >= 5
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                  : 'border-gray-300 dark:border-gray-600 hover:border-accent dark:hover:border-primary-light bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-10 h-10 mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF or WebP (MAX. 10MB)
                </p>
              </div>
            </label>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group animate-fadeInFast">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 group-hover:border-accent dark:group-hover:border-primary-light transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center transition-all shadow-lg hover:scale-110"
                    aria-label={`Remove image ${index + 1}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            'Uploading...'
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Listing
            </span>
          )}
        </Button>
      </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform transition-all animate-scaleIn overflow-hidden">
            {/* Header */}
            <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text dark:text-gray-100">
                  Success!
                </h2>
                <button
                  onClick={handleSuccessModalClose}
                  className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5 text-text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-text dark:text-gray-100 mb-2">
                  Item Added Successfully!
                </h3>
                <p className="text-sm text-text-secondary dark:text-gray-400">
                  Your listing is now live and visible to others.
                </p>
              </div>
              <div className="flex justify-center mt-4">
                <Button onClick={handleSuccessModalClose} className="px-8">
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
