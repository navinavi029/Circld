import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Alert } from './ui/Alert';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Select } from './ui/Select';
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
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

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

      setSuccess(true);
      setFormData({ title: '', description: '', category: '', condition: 'good' });
      setImages([]);
      setPreviews([]);

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert variant="error" className="mb-4 animate-fadeInFast">{error}</Alert>}
      {success && <Alert variant="success" className="mb-4 animate-fadeInFast">Item added successfully!</Alert>}

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

        <Select
          label="Category"
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
        >
          <option value="">Select a category</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </Select>

        <Select
          label="Condition"
          id="condition"
          name="condition"
          value={formData.condition}
          onChange={handleInputChange}
          required
          helperText="Be honest about the item's condition"
        >
          <option value="new">New - Never used, in original packaging</option>
          <option value="like-new">Like New - Barely used, excellent condition</option>
          <option value="good">Good - Used with minor wear</option>
          <option value="fair">Fair - Used with noticeable wear</option>
          <option value="poor">Poor - Heavily used, may need repairs</option>
        </Select>

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
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              Uploading...
            </span>
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
  );
}
