import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFinance } from '../context/FinanceContext'
import { useToast } from '../components/UI/Toast'
import { CategoryIcon, iconMap } from '../utils/categories'
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import Modal from '../components/UI/Modal'
import './CategoriesPage.css'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { categories, addCategory, deleteCategory, updateCategory } = useFinance()
  const { addToast } = useToast()

  const [tab, setTab] = useState('expense')
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#6C5CE7')
  const [formIcon, setFormIcon] = useState('MoreHorizontal')

  const colorOptions = [
    '#FF6B6B', '#4ECDC4', '#6C5CE7', '#FD79A8', '#E17055',
    '#00B894', '#A29BFE', '#FDCB6E', '#74B9FF', '#55EFC4',
    '#E84393', '#0984E3', '#F39C12', '#636E72', '#00D09C',
  ]

  const iconOptions = Object.keys(iconMap)
  const filtered = categories.filter(c => c.type === tab)

  const openNewModal = () => {
    setEditingCat(null)
    setFormName('')
    setFormColor('#6C5CE7')
    setFormIcon('MoreHorizontal')
    setShowModal(true)
  }

  const openEditModal = (cat) => {
    setEditingCat(cat)
    setFormName(cat.name)
    setFormColor(cat.color)
    setFormIcon(cat.icon)
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formName.trim()) {
      addToast('Insira um nome para a categoria', 'error')
      return
    }

    if (editingCat) {
      // Edit existing
      if (updateCategory) {
        updateCategory(editingCat.id, {
          name: formName.trim(),
          color: formColor,
          icon: formIcon,
        })
        addToast('Categoria atualizada!', 'success')
      }
    } else {
      // Create new
      addCategory({
        name: formName.trim(),
        icon: formIcon,
        color: formColor,
        type: tab,
      })
      addToast('Categoria criada!', 'success')
    }

    setShowModal(false)
  }

  const handleDelete = (cat) => {
    if (!cat.id.startsWith('custom_')) {
      addToast('Categorias padrão não podem ser removidas', 'warning')
      return
    }
    deleteCategory(cat.id)
    addToast('Categoria removida!', 'info')
  }

  return (
    <div className="page container">
      <header className="cat-header">
        <button className="cat-back" onClick={() => navigate(-1)} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
        <h1 className="cat-title">Categorias</h1>
        <button className="cat-add-btn" onClick={openNewModal} aria-label="Nova categoria">
          <Plus size={22} />
        </button>
      </header>

      {/* Tabs */}
      <div className="cat-tabs glass">
        <button
          className={`cat-tab ${tab === 'expense' ? 'active' : ''}`}
          onClick={() => setTab('expense')}
        >
          Despesas ({categories.filter(c => c.type === 'expense').length})
        </button>
        <button
          className={`cat-tab ${tab === 'income' ? 'active' : ''}`}
          onClick={() => setTab('income')}
        >
          Receitas ({categories.filter(c => c.type === 'income').length})
        </button>
      </div>

      {/* Category List */}
      <div className="cat-list stagger">
        {filtered.map(cat => {
          const isCustom = cat.id.startsWith('custom_')
          return (
            <div key={cat.id} className="cat-item">
              <div className="cat-item-icon" style={{ background: cat.color + '18', color: cat.color }}>
                <CategoryIcon iconName={cat.icon} size={20} color={cat.color} />
              </div>
              <div className="cat-item-info">
                <span className="cat-item-name">{cat.name}</span>
                <span className="cat-item-type">
                  {isCustom ? 'Personalizada' : 'Padrão'}
                </span>
              </div>
              <div className="cat-item-actions">
                {isCustom && (
                  <>
                    <button className="cat-action-btn edit" onClick={() => openEditModal(cat)} aria-label="Editar">
                      <Pencil size={14} />
                    </button>
                    <button className="cat-action-btn delete" onClick={() => handleDelete(cat)} aria-label="Deletar">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingCat ? 'Editar Categoria' : 'Nova Categoria'}
      >
        <div className="cat-form">
          <div className="form-group">
            <label>Nome da categoria</label>
            <input
              type="text"
              className="add-input"
              placeholder="Ex: Assinaturas"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Cor</label>
            <div className="color-grid">
              {colorOptions.map(c => (
                <button
                  key={c}
                  className={`color-opt ${formColor === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setFormColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Ícone</label>
            <div className="icon-grid">
              {iconOptions.map(name => (
                <button
                  key={name}
                  className={`icon-opt ${formIcon === name ? 'active' : ''}`}
                  onClick={() => setFormIcon(name)}
                  style={formIcon === name ? { borderColor: formColor, background: formColor + '15' } : {}}
                >
                  <CategoryIcon iconName={name} size={18} color={formIcon === name ? formColor : undefined} />
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="cat-preview">
            <div className="cat-preview-icon" style={{ background: formColor + '18', color: formColor }}>
              <CategoryIcon iconName={formIcon} size={24} color={formColor} />
            </div>
            <span className="cat-preview-name" style={{ color: formColor }}>
              {formName || 'Preview'}
            </span>
          </div>

          <button
            className="add-submit income"
            onClick={handleSubmit}
            disabled={!formName.trim()}
          >
            <Check size={20} />
            <span>{editingCat ? 'Salvar Alterações' : 'Criar Categoria'}</span>
          </button>
        </div>
      </Modal>
    </div>
  )
}
