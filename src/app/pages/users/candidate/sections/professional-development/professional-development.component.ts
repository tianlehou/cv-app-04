import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ProfessionalDevelopmentItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  duration?: string;
  certificateUrl?: string;
}

interface ProfessionalDevelopmentCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  items: ProfessionalDevelopmentItem[];
}

@Component({
  selector: 'app-professional-development',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professional-development.component.html',
  styleUrls: ['./professional-development.component.css']
})
export class ProfessionalDevelopmentComponent {
  @Input() isEditor: boolean = false;
  
  // Lista de categorías de desarrollo profesional
  categories: ProfessionalDevelopmentCategory[] = [
    {
      id: 'courses',
      title: 'Cursos',
      icon: 'fas fa-graduation-cap',
      description: 'Amplía tus conocimientos con cursos en línea o presenciales',
      items: []
    },
    {
      id: 'workshops',
      title: 'Talleres',
      icon: 'fas fa-chalkboard-teacher',
      description: 'Participa en talleres prácticos',
      items: []
    },
    {
      id: 'seminars',
      title: 'Seminarios',
      icon: 'fas fa-users',
      description: 'Asiste a seminarios especializados',
      items: []
    },
    {
      id: 'trainings',
      title: 'Entrenamientos',
      icon: 'fas fa-dumbbell',
      description: 'Mejora tus habilidades con entrenamientos específicos',
      items: []
    },
    {
      id: 'technical-studies',
      title: 'Estudios Técnicos',
      icon: 'fas fa-certificate',
      description: 'Obtén certificaciones técnicas',
      items: []
    },
    {
      id: 'degrees',
      title: 'Licenciaturas',
      icon: 'fas fa-university',
      description: 'Pursue higher education degrees',
      items: []
    }
  ];

  // Método para agregar un nuevo ítem a una categoría
  addItem(categoryId: string) {
    // Lógica para agregar un nuevo ítem
    console.log(`Agregando nuevo ítem a la categoría: ${categoryId}`);
    // Aquí iría la lógica para abrir un modal o formulario
  }

  // Método para editar un ítem
  editItem(categoryId: string, itemId: string) {
    console.log(`Editando ítem ${itemId} de la categoría: ${categoryId}`);
    // Lógica para editar un ítem
  }

  // Método para eliminar un ítem
  deleteItem(categoryId: string, itemId: string) {
    console.log(`Eliminando ítem ${itemId} de la categoría: ${categoryId}`);
    // Lógica para eliminar un ítem
  }
}
