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

// Helper function to check if getUserMedia is available
function checkCameraSupport(): boolean {
  console.log('Checking camera support...');
  console.log('navigator.mediaDevices:', navigator.mediaDevices);
  console.log('User agent:', navigator.userAgent);
  console.log('Protocol:', window.location.protocol);
  console.log('Hostname:', window.location.hostname);
  
  // Check for modern MediaDevices API
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log('Modern MediaDevices API detected');
    return true;
  }
  
  // Check for legacy getUserMedia (some older browsers)
  if ((navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia) {
    console.warn('Legacy getUserMedia detected, but MediaDevices API is preferred');
    return true;
  }
  
  // Check if we're on HTTPS or localhost (required for camera access on mobile)
  const isSecure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1';
  
  if (!isSecure) {
    console.error('Camera access requires secure context (HTTPS)');
    return false;
  }
  
  console.error('getUserMedia is not supported - navigator.mediaDevices:', navigator.mediaDevices);
  return false;
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
            
            // Determine the best supported MIME type
            let mimeType = 'video/webm;codecs=vp9';
            
            // Fallback to VP8 if VP9 is not supported
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/webm;codecs=vp8';
            }
            
            // Fallback to default if VP8 is not supported
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/webm';
            }
            
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
              const blob = new Blob(recordedChunks, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nescafe-recording-${Date.now()}.webm`;
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

