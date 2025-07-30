// video-grid.component.ts
import { Component, Input, OnInit, ChangeDetectorRef, NgZone, OnDestroy, EnvironmentInjector } from '@angular/core';
import { ViewChildren, QueryList, ElementRef, AfterViewInit, inject, runInInjectionContext } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { ToastService } from 'src/app/shared/components/toast/toast.service';
import { FirebaseService } from 'src/app/shared/services/firebase.service';
import { ConfirmationModalService } from 'src/app/shared/components/confirmation-modal/confirmation-modal.service';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { Database, ref as dbRef, set, get } from '@angular/fire/database';
import { VideoInfoBarComponent } from './video-info-bar/video-info-bar.component';
import { VideoUploadButtonComponent } from './video-upload-button/video-upload-button.component';
import { VideoUploadProgressBarComponent } from './video-upload-progress-bar/video-upload-progress-bar.component';
import { VideoEmptyGalleryMessageComponent } from './video-empty-gallery-message/video-empty-gallery-message.component';
import { VideoItemContainerComponent } from './video-item-container/video-item-container.component';
import { ExamplesService } from 'src/app/shared/services/examples.service';

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
export class VideoGridComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<
    ElementRef<HTMLVideoElement>
  >;
  @Input() currentUser: User | null = null;
  @Input() isEditor: boolean = false;
  @Input() readOnly: boolean = false;
  @Input() isExample: boolean = false;
  userEmailKey: string | null = null;

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
  private database = inject(Database);
  private examplesService = inject(ExamplesService);
  private currentExampleSubscription?: Subscription;
  private injector = inject(EnvironmentInjector);

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

  // Método para actualizar los videos en la base de datos (usuario o ejemplo)
  private async updateVideos(videos: string[]): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      if (this.isExample) {
        const exampleId = this.examplesService.getCurrentExampleId();
        if (!exampleId) return;
        
        const exampleRef = dbRef(this.database, `cv-app/examples/${exampleId}/gallery-videos`);
        await set(exampleRef, videos);
      } else if (this.currentUser?.email) {
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
    });
  }

  // Método para obtener los videos del usuario o del ejemplo
  private async getVideos(userEmailKey: string): Promise<string[]> {
    return runInInjectionContext(this.injector, async () => {
      if (this.isExample) {
        const exampleId = this.examplesService.getCurrentExampleId();
        if (!exampleId) return [];
        
        // Intentar obtener los videos del ejemplo
        const exampleRef = dbRef(this.database, `cv-app/examples/${exampleId}/gallery-videos`);
        const snapshot = await get(exampleRef);
        return snapshot.exists() ? snapshot.val() : [];
      } else {
        // Obtener los videos del usuario
        const userData = await this.firebaseService.getUserData(userEmailKey);
        return userData?.profileData?.multimedia?.galleryVideos || [];
      }
    });
  }

  // Método para eliminar un video del almacenamiento de Firebase
  // Utiliza la URL del video para crear una referencia y eliminar el objeto del almacenamiento
  private async deleteVideoFromStorage(videoUrl: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const videoRef = ref(this.storage, videoUrl);
      await deleteObject(videoRef);
    });
  }

  // Método del ciclo de vida de Angular para inicializar el componente
  ngOnInit(): void {
    if (this.isExample) {
      // Suscribirse a cambios en el ID de ejemplo
      this.currentExampleSubscription = this.examplesService.currentExampleId$
        .pipe(
          filter(exampleId => !!exampleId),
          distinctUntilChanged()
        )
        .subscribe(exampleId => {
          this.loadVideos(''); // No necesitamos el userEmailKey para ejemplos
        });
    } else if (this.validateCurrentUser(this.currentUser)) {
      if (this.currentUser.email) {
        this.userEmailKey = this.firebaseService.formatEmailKey(this.currentUser.email);
        this.loadVideos(this.userEmailKey);
      }
    }
  }

  // Método del ciclo de vida de Angular para inicializar la vista
  // Configura los reproductores de video y sus eventos, y suscribe a cambios en la lista de reproductores
  // para actualizar la configuración si se agregan o eliminan videos
  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  // Método del ciclo de vida para limpiar suscripciones
  ngOnDestroy(): void {
    if (this.currentExampleSubscription) {
      this.currentExampleSubscription.unsubscribe();
    }
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
  private async deleteVideo(videoUrl: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      if (!this.currentUser?.email && !this.isExample) return;

      this.state = this.updateState(this.state, { isLoading: true });

      try {
        await this.deleteVideoFromStorage(videoUrl);
        const updatedVideos = this.state.userVideos.filter(
          (vid) => vid !== videoUrl
        );
        await this.updateVideos(updatedVideos);
        this.toast.show('Video eliminado exitosamente', 'success');
        
        let loadKey = '';
        if (!this.isExample && this.currentUser && this.currentUser.email) {
          loadKey = this.firebaseService.formatEmailKey(this.currentUser.email);
        }
        await this.loadVideos(loadKey);
      } catch (error) {
        this.handleError('Error eliminando video', error);
      } finally {
        this.state = this.updateState(this.state, { isLoading: false });
      }
    });
  }

  // Método para cargar los videos del usuario o del ejemplo
  // Valida el contexto actual, muestra un mensaje de carga y obtiene los videos
  private async loadVideos(userEmailKey: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      try {
        this.state = this.updateState(this.state, { isLoading: true });
        const videos = await this.getVideos(userEmailKey);
        this.state = this.updateState(this.state, {
          userVideos: this.sortVideosByDate(videos || []),
          expandedStates: this.initExpandedStates(videos || []),
          isLoading: false,
        });
      } catch (error) {
        this.handleError('Error al cargar los videos', error);
        this.state = this.updateState(this.state, { 
          userVideos: [],
          isLoading: false 
        });
      }
    });
  }

  // Método para manejar la subida de videos
  handleUploadComplete(downloadURL: string): void {
    runInInjectionContext(this.injector, () => {
      if ((!this.currentUser || !this.userEmailKey) && !this.isExample) return;

      this.ngZone.run(() => {
        this.resetUploadState();
        const loadKey = this.isExample ? '' : this.userEmailKey || '';
        this.updateVideos([...this.state.userVideos, downloadURL]).then(() =>
          this.loadVideos(loadKey)
        );
      });
    });
  }

  // Método para manejar el progreso de la subida
  // Actualiza el estado del componente con el progreso de la subida
  handleUploadProgress(progressData: {
    progress: number;
    uploaded: number;
    total: number;
  }): void {
    runInInjectionContext(this.injector, () => {
      this.state = this.updateState(this.state, {
        uploadProgress: progressData.progress,
        uploadedSize: progressData.uploaded,
        totalSize: progressData.total,
      });
    });
  }
}
