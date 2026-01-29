/**
 * Ícones otimizados - apenas os ícones realmente usados em componentes globais
 * Isso reduz drasticamente o bundle inicial (571.js) ao evitar importar todo o lucide-react
 * 
 * IMPORTANTE: Este arquivo exporta APENAS ícones usados em:
 * - AppSidebar (usado em todas as páginas)
 * - AppLayout (usado em todas as páginas)
 * 
 * Para ícones usados apenas em páginas específicas, importe diretamente de lucide-react
 */

// Ícones do AppSidebar (menu principal)
export { LayoutDashboard } from "lucide-react";
export { FileText } from "lucide-react";
export { Users } from "lucide-react";
export { Receipt } from "lucide-react";
export { Calendar } from "lucide-react";
export { FolderOpen } from "lucide-react";
export { Settings } from "lucide-react";
export { Briefcase } from "lucide-react";
export { ChevronDown } from "lucide-react";
export { LogOut } from "lucide-react";
export { Bell } from "lucide-react";

// Ícones do AppLayout (header)
export { Search } from "lucide-react";
export { Plus } from "lucide-react";
