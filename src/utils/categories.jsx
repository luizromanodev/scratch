import {
  ShoppingCart, Car, Home, Utensils, Briefcase, Heart,
  GraduationCap, Gamepad2, Shirt, Wifi, Smartphone, Gift,
  Plane, Dumbbell, Coffee, Baby, PawPrint,
  TrendingUp, Banknote, Landmark, Coins, Star,
  MoreHorizontal
} from 'lucide-react'

export const defaultCategories = [
  { id: 'food', name: 'Alimentação', icon: 'Utensils', color: '#FF6B6B', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: 'Car', color: '#4ECDC4', type: 'expense' },
  { id: 'housing', name: 'Moradia', icon: 'Home', color: '#6C5CE7', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: 'ShoppingCart', color: '#FD79A8', type: 'expense' },
  { id: 'health', name: 'Saúde', icon: 'Heart', color: '#E17055', type: 'expense' },
  { id: 'education', name: 'Educação', icon: 'GraduationCap', color: '#00B894', type: 'expense' },
  { id: 'entertainment', name: 'Lazer', icon: 'Gamepad2', color: '#A29BFE', type: 'expense' },
  { id: 'clothing', name: 'Vestuário', icon: 'Shirt', color: '#FDCB6E', type: 'expense' },
  { id: 'bills', name: 'Contas', icon: 'Wifi', color: '#74B9FF', type: 'expense' },
  { id: 'phone', name: 'Celular', icon: 'Smartphone', color: '#55EFC4', type: 'expense' },
  { id: 'gifts', name: 'Presentes', icon: 'Gift', color: '#E84393', type: 'expense' },
  { id: 'travel', name: 'Viagem', icon: 'Plane', color: '#0984E3', type: 'expense' },
  { id: 'fitness', name: 'Academia', icon: 'Dumbbell', color: '#F39C12', type: 'expense' },
  { id: 'coffee', name: 'Café', icon: 'Coffee', color: '#8B6914', type: 'expense' },
  { id: 'pets', name: 'Pets', icon: 'PawPrint', color: '#B2BEC3', type: 'expense' },
  { id: 'baby', name: 'Filhos', icon: 'Baby', color: '#FAB1A0', type: 'expense' },
  { id: 'salary', name: 'Salário', icon: 'Banknote', color: '#00D09C', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'Briefcase', color: '#00B894', type: 'income' },
  { id: 'investment', name: 'Investimentos', icon: 'TrendingUp', color: '#6C5CE7', type: 'income' },
  { id: 'rental', name: 'Aluguel', icon: 'Landmark', color: '#0984E3', type: 'income' },
  { id: 'bonus', name: 'Bônus', icon: 'Star', color: '#FDCB6E', type: 'income' },
  { id: 'other_income', name: 'Outros', icon: 'Coins', color: '#55EFC4', type: 'income' },
  { id: 'other', name: 'Outros', icon: 'MoreHorizontal', color: '#636E72', type: 'expense' },
]

export const iconMap = {
  ShoppingCart, Car, Home, Utensils, Briefcase, Heart,
  GraduationCap, Gamepad2, Shirt, Wifi, Smartphone, Gift,
  Plane, Dumbbell, Coffee, Baby, PawPrint,
  TrendingUp, Banknote, Landmark, Coins, Star,
  MoreHorizontal
}

export function getCategoryById(categories, id) {
  return categories.find(c => c.id === id) || categories.find(c => c.id === 'other')
}

export function getCategoriesByType(categories, type) {
  return categories.filter(c => c.type === type)
}

export function CategoryIcon({ iconName, size = 20, color }) {
  const Icon = iconMap[iconName]
  if (!Icon) return <MoreHorizontal size={size} color={color} />
  return <Icon size={size} color={color} />
}
