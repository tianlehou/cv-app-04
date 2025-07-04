// video-grid.component.ts
import { Component, Input, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ViewChildren, QueryList, ElementRef, AfterViewInit, inject } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/services/confirmation-modal.service';
import { Storage, ref, deleteObject, getMetadata } from '@angular/fire/storage';
import { VideoInfoBarComponent } from './video-info-bar/video-info-bar.component';
import { VideoUploadButtonComponent } from './video-upload-button/video-upload-button.component';
import { VideoUploadProgressBarComponent } from './video-upload-progress-bar/video-upload-progress-bar.component';
import { VideoEmptyGalleryMessageComponent } from './video-empty-gallery-message/video-empty-gallery-message.component';
import { VideoItemContainerComponent } from './video-item-container/video-item-container.component';

interface VideoGridState {
  userVideos: string[];
  isLoading: boolean;
  expandedStates: Record<string, boolean>;
  totalUploadedMB: number;
  uploadProgress: number | null;
  uploadedSize: number;
  totalSize: number;
}

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [
    CommonModule,
    VideoInfoBarComponent,
    VideoUploadButtonComponent,
    VideoUploadProgressBarComponent,
    VideoEmptyGalleryMessageComponent,
    VideoItemContainerComponent,
  ],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<
    ElementRef<HTMLVideoElement>
  >;
  @Input() currentUser: User | null = null;
  @Input() readOnly: boolean = false;

  state: VideoGridState = {
    userVideos: [],
    isLoading: false,
    expandedStates: {},
    totalUploadedMB: 0,
    uploadProgress: null,
    uploadedSize: 0,
    totalSize: 0,
  };

  private storage = inject(Storage);
  private toast = inject(ToastService);
  private confirmationModal = inject(ConfirmationModalService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  // Método para ordenar los videos por fecha
  // Extrae la fecha del nombre del archivo y ordena los videos en orden descendente
  private sortVideosByDate(videos: string[]): string[] {
    return [...videos].sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }

  // Método para inicializar los estados de expansión de los videos
  // Crea un objeto donde cada video tiene un estado de expansión inicial en falso
  private initExpandedStates(videos: string[]): Record<string, boolean> {
    return videos.reduce((acc, video) => {
      acc[video] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }

  // Método para validar el usuario actual
  // Verifica si el usuario tiene un email válido
  private validateCurrentUser(user: User | null): user is User {
    return !!user?.email;
  }

  // Método para rastrear los videos por su URL
  // Utiliza la URL del video como clave para mejorar el rendimiento en la renderización
  protected trackByVideoUrl(index: number, videoUrl: string): string {
    return videoUrl;
  }

  // Método para configurar los reproductores de video
  // Agrega un evento de reproducción a cada reproductor de video para pausar otros videos
  private setupVideoPlayers(): void {
    this.videoPlayers.forEach((video) => {
      video.nativeElement.addEventListener('play', (e: Event) =>
        this.onVideoPlay(e)
      );
    });
  }

  // Método para manejar el evento de reproducción de video
  // Pausa todos los videos excepto el que se está reproduciendo actualmente
  private onVideoPlay(event: Event): void {
    const playingVideo = event.target as HTMLVideoElement;
    this.videoPlayers.forEach((video) => {
      if (video.nativeElement !== playingVideo) {
        video.nativeElement.pause();
      }
    });
  }

  // Método para manejar errores
  // Muestra un mensaje de error en la consola y en un toast
  private handleError(message: string, error: any): void {
    this.ngZone.run(() => {
      console.error(`${message}:`, error);
      this.toast.show(message, 'error');
    });
  }

  // Método para actualizar el estado del componente
  // Combina el estado actual con un estado parcial y ejecuta la detección de cambios
  private updateState<T>(currentState: T, partialState: Partial<T>): T {
    const newState = { ...currentState, ...partialState };
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });
    return newState;
  }

  // Método para actualizar los videos del usuario en la base de datos
  // Obtiene los datos actuales del usuario y actualiza la lista de videos en su perfil
  private async updateUserVideos(videos: string[]): Promise<void> {
    if (!this.currentUser?.email) return;

    const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
    const currentData = await this.firebaseService.getUserData(userEmailKey);

    await this.firebaseService.updateUserData(this.currentUser.email, {
      profileData: {
        ...currentData.profileData,
        multimedia: {
          ...currentData.profileData?.multimedia,
          galleryVideos: videos,
        },
      },
    });
  }

  // Método para obtener los videos del usuario desde la base de datos
  // Utiliza la clave de email del usuario para acceder a sus datos y extraer los
  private async getVideos(userEmailKey: string): Promise<string[]> {
    const userData = await this.firebaseService.getUserData(userEmailKey);
    return userData?.profileData?.multimedia?.galleryVideos || [];
  }

  // Método para eliminar un video del almacenamiento de Firebase
  // Utiliza la URL del video para crear una referencia y eliminar el objeto del almacenamiento
  private async deleteVideoFromStorage(videoUrl: string): Promise<void> {
    const videoRef = ref(this.storage, videoUrl);
    await deleteObject(videoRef);
  }

  // Método para obtener la clave de email del usuario actual
  // Formatea el email del usuario para usarlo como clave en Firebase
  get userEmailKey(): string | null {
    return this.currentUser?.email
      ? this.firebaseService.formatEmailKey(this.currentUser.email)
      : null;
  }

  // Método del ciclo de vida de Angular para inicializar el componente
  // Verifica si el usuario actual es válido y carga los videos asociados a su email
  ngOnInit(): void {
    if (this.validateCurrentUser(this.currentUser)) {
      const userEmailKey = this.firebaseService.formatEmailKey(this.currentUser!.email!);
      this.loadVideos(userEmailKey);
    }
  }

  // Método del ciclo de vida de Angular para inicializar la vista
  // Configura los reproductores de video y sus eventos, y suscribe a cambios en la lista de reproductores
  // para actualizar la configuración si se agregan o eliminan videos
  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  // Método para reiniciar el estado de subida
  // Resetea el progreso de subida, el tamaño subido y el tamaño total a cero
  // Esto se utiliza después de completar una subida o al iniciar una nueva
  private resetUploadState(): void {
    this.state = this.updateState(this.state, {
      uploadProgress: null,
      uploadedSize: 0,
      totalSize: 0,
    });
  }

  // Método para alternar la expansión de un video
  // Actualiza el estado de expansión del video especificado en el objeto de estado
  toggleExpansion(videoUrl: string): void {
    this.state = this.updateState(this.state, {
      expandedStates: {
        ...this.state.expandedStates,
        [videoUrl]: !this.state.expandedStates[videoUrl],
      },
    });
  }

  // Método para confirmar la eliminación de un video
  // Muestra un modal de confirmación antes de proceder con la eliminación
  confirmDeleteVideo(videoUrl: string): void {
    this.confirmationModal.show(
      {
        title: 'Eliminar Video',
        message: '¿Estás seguro de que deseas eliminar este video?',
      },
      () => this.deleteVideo(videoUrl)
    );
  }

  // Método para eliminar un video
  // Valida el usuario actual, muestra un mensaje de carga y maneja la eliminación
  private async deleteVideo(videoUrl: string): Promise<void> {
    if (!this.validateCurrentUser(this.currentUser)) return;

    this.state = this.updateState(this.state, { isLoading: true });

    try {
      await this.deleteVideoFromStorage(videoUrl);
      const updatedVideos = this.state.userVideos.filter(
        (vid) => vid !== videoUrl
      );
      await this.updateUserVideos(updatedVideos);
      this.toast.show('Video eliminado exitosamente', 'success');
      this.loadVideos(this.firebaseService.formatEmailKey(this.currentUser!.email!));
    } catch (error) {
      this.handleError('Error eliminando video', error);
    } finally {
      this.state = this.updateState(this.state, { isLoading: false });
    }
  }

  // Método para cargar los videos del usuario
  // Valida el usuario actual, muestra un mensaje de carga y obtiene los videos
  private async loadVideos(userEmailKey: string): Promise<void> {
    this.state = this.updateState(this.state, { isLoading: true });

    try {
      const videos = await this.getVideos(userEmailKey);
      const sortedVideos = this.sortVideosByDate(videos);

      this.state = this.updateState(this.state, {
        userVideos: sortedVideos,
        expandedStates: this.initExpandedStates(sortedVideos),
        isLoading: false,
      });
    } catch (error) {
      this.handleError('Error cargando videos', error);
      this.state = this.updateState(this.state, { isLoading: false });
    }
  }

  // Método para manejar la subida de videos
  // Valida el usuario actual, muestra un mensaje de carga y sube el video
  handleUploadComplete(downloadURL: string): void {
    if (!this.currentUser || !this.userEmailKey) return;

    this.ngZone.run(() => {
      this.resetUploadState();
      this.updateUserVideos([...this.state.userVideos, downloadURL]).then(() =>
        this.loadVideos(this.userEmailKey!)
      );
    });
  }

  // Método para manejar el progreso de la subida
  // Actualiza el estado del componente con el progreso de la subida
  handleUploadProgress(progressData: {
    progress: number;
    uploaded: number;
    total: number;
  }): void {
    this.state = this.updateState(this.state, {
      uploadProgress: progressData.progress,
      uploadedSize: progressData.uploaded,
      totalSize: progressData.total,
    });
  }
}
