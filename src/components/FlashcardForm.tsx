import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, X, Upload, Mic, Square, Camera } from 'lucide-react';

interface FlashcardFormProps {
  deckId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FlashcardForm: React.FC<FlashcardFormProps> = ({ deckId, onSuccess, onCancel }) => {
  const [english, setEnglish] = useState('');
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const errors: {[key: string]: string} = {};
    
    if (!english.trim()) {
      errors.english = 'English word is required';
    }
    
    if (!arabic.trim() && !transliteration.trim()) {
      errors.translation = 'Either Arabic or Transliteration is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        setAudioFile(file);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTagAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let imageUrl = null;
      let audioUrl = null;
      
      // Upload image if exists
      if (imageFile) {
        const imagePath = `flashcard-images/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('flashcard-images')
          .upload(imagePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('flashcard-images')
          .getPublicUrl(imagePath);
          
        imageUrl = publicUrl;
      }
      
      // Upload audio if exists
      if (audioFile) {
        const audioPath = `flashcard-audio/${Date.now()}-${audioFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('flashcard-audio')
          .upload(audioPath, audioFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('flashcard-audio')
          .getPublicUrl(audioPath);
          
        audioUrl = publicUrl;
      }
      
const { error: insertError } = await supabase
  .from('flashcards')
  .insert({
    deck_id: deckId,
    english: english,       // Changed from "English" to "english"
    arabic: arabic,         // Changed from "Arabic" to "arabic"
    transliteration: transliteration,
    image_url: imageUrl,
    audio_url: audioUrl,
    tags: tags              // Assuming tags is stored as a text[] column
  });

        
      if (insertError) throw insertError;
      
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flashcard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* English Word */}
      <div>
        <label className="block text-sm font-medium mb-1">
          English Word *
        </label>
        <input
          type="text"
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          className={`w-full p-2 border rounded-lg dark:bg-dark-200 ${
            validationErrors.english 
              ? 'border-red-500 dark:border-red-800' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {validationErrors.english && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validationErrors.english}
          </p>
        )}
      </div>

      {/* Arabic Word */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Arabic Word
        </label>
        <input
          type="text"
          value={arabic}
          onChange={(e) => setArabic(e.target.value)}
          dir="rtl"
          className={`w-full p-2 border rounded-lg dark:bg-dark-200 ${
            validationErrors.translation 
              ? 'border-red-500 dark:border-red-800' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
      </div>

      {/* Transliteration */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Transliteration
        </label>
        <input
          type="text"
          value={transliteration}
          onChange={(e) => setTransliteration(e.target.value)}
          className={`w-full p-2 border rounded-lg dark:bg-dark-200 ${
            validationErrors.translation 
              ? 'border-red-500 dark:border-red-800' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {validationErrors.translation && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validationErrors.translation}
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Image
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-100"
          >
            <Upload size={18} className="inline mr-2" />
            Upload Image
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-100"
          >
            <Camera size={18} className="inline mr-2" />
            Take Photo
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelect}
          className="hidden"
        />
        {imagePreview && (
          <div className="mt-2 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-40 rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Audio Upload/Recording */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Audio
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-100"
          >
            <Upload size={18} className="inline mr-2" />
            Upload Audio
          </button>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 border rounded-lg ${
              isRecording
                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-dark-100'
            }`}
          >
            {isRecording ? (
              <Square size={18} className="inline mr-2" />
            ) : (
              <Mic size={18} className="inline mr-2" />
            )}
            {isRecording ? 'Stop Recording' : 'Record Audio'}
          </button>
        </div>
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={handleAudioSelect}
          className="hidden"
        />
        {audioFile && (
          <div className="mt-2 flex items-center">
            <audio controls className="max-w-full">
              <source src={URL.createObjectURL(audioFile)} />
            </audio>
            <button
              type="button"
              onClick={() => setAudioFile(null)}
              className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Tags
        </label>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagAdd}
          placeholder="Type and press Enter to add tags"
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-dark-200"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-emerald-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-100 rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 flex items-center"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Save Flashcard'
          )}
        </button>
      </div>
    </form>
  );
};

export default FlashcardForm;

