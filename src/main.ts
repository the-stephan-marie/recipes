import { bootstrapCameraKit, createMediaStreamSource } from '@snap/camera-kit';

// Helper function to display error messages
function showError(message: string) {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; font-family: Arial, sans-serif; max-width: 80%; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  
  // Remove error after 10 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 10000);
}

(async function () {
  try {
    // Log environment info for debugging
    console.log('Initializing camera...');
    console.log('User agent:', navigator.userAgent);
    console.log('Protocol:', window.location.protocol);
    console.log('navigator.mediaDevices:', navigator.mediaDevices);
    
    // Check HTTPS requirement (camera requires secure context on mobile)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      showError('Camera access requires HTTPS. Please access this page over HTTPS.');
      console.error('Camera access requires secure context (HTTPS)');
      return;
    }

    console.log('Initializing Camera Kit...');
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzY1NDQxNTI5LCJzdWIiOiIzZjNkNGI4ZC0wNGRlLTRkMTQtYTQ1Ni1iMzVjZTkwZDRlNTh-U1RBR0lOR34wOTJiZmQ2Ny1hNGVhLTRmMDQtYTNkYS1jZGM4MmNjZGE5YTkifQ.MqrGTmxVteuROEdOPt6vKkEuxahGdCLUOalnGEcB8hs',
    });
    
    const liveRenderTarget = document.getElementById(
      'canvas'
    ) as HTMLCanvasElement;
    
    if (!liveRenderTarget) {
      showError('Canvas element not found. Please ensure a canvas with id="canvas" exists.');
      console.error('Canvas element not found');
      return;
    }

    console.log('Creating Camera Kit session...');
    const session = await cameraKit.createSession({ liveRenderTarget });
    
    // Request access to the back-facing camera with error handling
    let mediaStream: MediaStream | null = null;
    try {
      console.log('Requesting camera access (back camera)...');
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      console.log('Camera access granted');
    } catch (cameraError: any) {
      console.error('Failed to access back camera:', cameraError);
      
      // Try front camera as fallback
      try {
        console.log('Trying front camera as fallback...');
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        console.log('Front camera access granted');
      } catch (frontCameraError: any) {
        console.error('Failed to access front camera:', frontCameraError);
        
        // Provide specific error messages
        if (cameraError.name === 'NotAllowedError' || frontCameraError.name === 'NotAllowedError') {
          showError('Camera permission denied. Please allow camera access in your browser settings and refresh the page.');
        } else if (cameraError.name === 'NotFoundError' || frontCameraError.name === 'NotFoundError') {
          showError('No camera found. Please ensure a camera is connected to your device.');
        } else if (cameraError.name === 'NotReadableError' || frontCameraError.name === 'NotReadableError') {
          showError('Camera is already in use by another application. Please close other apps using the camera.');
        } else {
          showError(`Camera access failed: ${cameraError.message || 'Unknown error'}. Please check your browser settings.`);
        }
        return;
      }
    }

    if (!mediaStream) {
      showError('Failed to get camera stream. Please try refreshing the page.');
      console.error('MediaStream is null');
      return;
    }

    // Create a media stream source
    console.log('Creating media stream source...');
    const source = createMediaStreamSource(mediaStream, {
      cameraType: mediaStream.getVideoTracks()[0]?.getSettings().facingMode === 'environment' ? 'environment' : 'user',
    });

    console.log('Setting camera source and starting playback...');
    await session.setSource(source);
    await session.play();
    console.log('Camera feed started successfully');

    // Adjust canvas size to fill screen while maintaining camera aspect ratio (cover mode)
    const adjustCanvasSize = () => {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        const videoWidth = settings.width || 1280;
        const videoHeight = settings.height || 720;
        const videoAspectRatio = videoWidth / videoHeight;
        const viewportAspectRatio = window.innerWidth / window.innerHeight;

        // Cover mode: fill entire viewport while maintaining aspect ratio
        if (videoAspectRatio > viewportAspectRatio) {
          // Video is wider than viewport - fill height, width may extend beyond
          liveRenderTarget.style.height = '100vh';
          liveRenderTarget.style.width = `${100 * videoAspectRatio}vh`;
        } else {
          // Video is taller than viewport - fill width, height may extend beyond
          liveRenderTarget.style.width = '100vw';
          liveRenderTarget.style.height = `${100 / videoAspectRatio}vw`;
        }
      }
    };

    // Adjust canvas size initially and on window resize
    adjustCanvasSize();
    window.addEventListener('resize', adjustCanvasSize);

    // Load and apply lens
    try {
      console.log('Loading lens...');
      const lens = await cameraKit.lensRepository.loadLens(
        '4783cf00-4f42-420e-a822-1202ee9ec8c2',
        '0d9e6d69-838d-4aa2-b232-645c0880f09b'
      );

      await session.applyLens(lens);
      console.log('Lens applied successfully');
    } catch (error) {
      console.error('Failed to load or apply lens:', error);
      showError(`Lens failed to load: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the lens ID and group ID.`);
    }

    // Setup recording functionality using MediaRecorder API
    const recordButton = document.getElementById('record-button') as HTMLButtonElement;
    let isRecording = false;
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];

    if (recordButton) {
      recordButton.addEventListener('click', async () => {
        try {
          if (!isRecording) {
            // Start recording using MediaRecorder API
            console.log('Starting recording...');
            
            // Get the canvas stream
            const canvasStream = liveRenderTarget.captureStream(30); // 30 FPS
            
            // Detect iOS devices
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            
            // Determine the best supported MIME type
            let mimeType = '';
            let fileExtension = 'webm';
            let blobType = 'video/webm';
            
            if (isIOS) {
              // iOS Safari supports MP4/H.264
              const iosTypes = [
                'video/mp4;codecs=h264',
                'video/mp4',
                'video/quicktime'
              ];
              
              for (const type of iosTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                  mimeType = type;
                  fileExtension = 'mp4';
                  blobType = type.includes('quicktime') ? 'video/quicktime' : 'video/mp4';
                  break;
                }
              }
              
              // If no iOS type is supported, try WebM as fallback
              if (!mimeType) {
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                  mimeType = 'video/webm;codecs=vp9';
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                  mimeType = 'video/webm;codecs=vp8';
                } else if (MediaRecorder.isTypeSupported('video/webm')) {
                  mimeType = 'video/webm';
                }
              }
            } else {
              // Android and desktop browsers - prefer WebM
              if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
              } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                mimeType = 'video/webm;codecs=vp8';
              } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
              } else if (MediaRecorder.isTypeSupported('video/mp4')) {
                // Fallback to MP4 if WebM is not supported
                mimeType = 'video/mp4';
                fileExtension = 'mp4';
                blobType = 'video/mp4';
              }
            }
            
            if (!mimeType) {
              throw new Error('No supported video format found. Your browser may not support video recording.');
            }
            
            console.log('Using MIME type:', mimeType);
            
            // Create MediaRecorder with the determined MIME type
            const options: MediaRecorderOptions = {
              mimeType: mimeType,
            };
            
            mediaRecorder = new MediaRecorder(canvasStream, options);
            recordedChunks = [];
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: blobType });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nescafe-recording-${Date.now()}.${fileExtension}`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              console.log('Video downloaded');
            };
            
            mediaRecorder.start();
            isRecording = true;
            recordButton.classList.add('recording');
            console.log('Recording started');
          } else {
            // Stop recording
            console.log('Stopping recording...');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
            isRecording = false;
            recordButton.classList.remove('recording');
            console.log('Recording stopped');
          }
        } catch (error) {
          console.error('Recording error:', error);
          showError(`Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          isRecording = false;
          recordButton.classList.remove('recording');
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }
      });
    }
  } catch (error) {
    console.error('Fatal error during initialization:', error);
    showError(`Failed to initialize camera: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh the page.`);
  }
})();

