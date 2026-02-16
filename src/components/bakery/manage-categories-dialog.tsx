'use client';

import { useState } from 'react';
import { useBakeryCategories } from '@/context/bakery-categories-context';
import { useProducts } from '@/hooks/use-products';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Edit, Plus, Trash2 } from 'lucide-react';

type ManageCategoriesDialogProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

export function ManageCategoriesDialog({ isOpen, setIsOpen }: ManageCategoriesDialogProps) {
  const { categories, addCategory, renameCategory, deleteCategory } = useBakeryCategories();
  const { products, updateProduct } = useProducts();
  const { toast } = useToast();
  
  const [newCategory, setNewCategory] = useState('');
  const [renamePayload, setRenamePayload] = useState<{ oldName: string; newName: string } | null>(null);

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    if (trimmedCategory) {
      if (categories.map(c => c.toLowerCase()).includes(trimmedCategory.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category exists', description: 'This category already exists.' });
      } else {
        addCategory(trimmedCategory);
        setNewCategory('');
        toast({ title: 'Category Added', description: `"${trimmedCategory}" has been added.` });
      }
    }
  };

  const handleRename = () => {
    if (!renamePayload) return;
    const { oldName, newName } = renamePayload;
    const trimmedNewName = newName.trim();

    if (!trimmedNewName || oldName.toLowerCase() === trimmedNewName.toLowerCase()) {
      setRenamePayload(null);
      return;
    }
    
    if (categories.map(c => c.toLowerCase()).includes(trimmedNewName.toLowerCase())) {
        toast({ variant: 'destructive', title: 'Category Exists', description: 'A category with this name already exists.' });
        return;
    }

    renameCategory(oldName, trimmedNewName);
    
    products.forEach(p => {
      if (p.subCategory?.toLowerCase() === oldName.toLowerCase()) {
        updateProduct(p.id, { subCategory: trimmedNewName });
      }
    });

    toast({ title: 'Category Renamed', description: `"${oldName}" was renamed to "${trimmedNewName}".` });
    setRenamePayload(null);
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const lowerCaseCategory = categoryToDelete.toLowerCase();
    
    if (lowerCaseCategory === 'other') {
      toast({ variant: 'destructive', title: 'Cannot Delete', description: 'The "other" category cannot be deleted.' });
      return;
    }

    const productsInCategory = products.filter(p => p.subCategory?.toLowerCase() === lowerCaseCategory);

    deleteCategory(categoryToDelete);

    if (productsInCategory.length > 0) {
        productsInCategory.forEach(p => {
            updateProduct(p.id, { subCategory: 'other' });
        });
        
        if (!categories.map(c => c.toLowerCase()).includes('other')) {
            addCategory('other');
        }
        toast({ title: 'Category Deleted', description: `Products in "${categoryToDelete}" were moved to "Other".` });
    } else {
        toast({ title: 'Category Deleted', description: `"${categoryToDelete}" has been deleted.` });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Product Categories</DialogTitle>
            <DialogDescription>Add, rename, or delete your product categories.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {(categories.length > 0 ? categories.sort() : []).map(category => (
                <div key={category} className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
                  <span className="capitalize font-medium">{category}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setRenamePayload({ oldName: category, newName: category })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button disabled={category.toLowerCase() === 'other'} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete the "{category}" category. Any products in this category will be moved to "Other". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCategory(category)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No categories created yet. Add one below.</p>
              )}
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Nested Rename Dialog */}
      <Dialog open={!!renamePayload} onOpenChange={(open) => !open && setRenamePayload(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Category "{renamePayload?.oldName}"</DialogTitle>
            </DialogHeader>
            <Input
                value={renamePayload?.newName || ''}
                onChange={(e) => renamePayload && setRenamePayload({ ...renamePayload, newName: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                placeholder="Enter new category name"
                autoFocus
            />
            <DialogFooter>
                <Button variant="outline" onClick={() => setRenamePayload(null)}>Cancel</Button>
                <Button onClick={handleRename}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
