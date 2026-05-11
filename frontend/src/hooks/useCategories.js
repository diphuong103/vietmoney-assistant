import { useEffect, useState } from 'react';
import categoryApi from '../api/categoryApi';

export default function useCategories() {
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      const data = await categoryApi.getAll();

      // data đã là mảng
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Load categories failed', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const addCategory = async (payload) => {
    try {
      const created = await categoryApi.create(payload);

      setCategories((prev) => [...prev, created]);

      return created;
    } catch (error) {
      console.error('Add category failed', error);
      throw error;
    }
  };

  const deleteCategory = async (id) => {
    try {
      await categoryApi.delete(id);

      setCategories((prev) =>
        prev.filter((cat) => cat.id !== id)
      );
    } catch (error) {
      console.error('Delete category failed', error);
      throw error;
    }
  };

  return {
    categories,
    loadCategories,
    addCategory,
    deleteCategory,
  };
}