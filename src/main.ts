import { bootstrapCameraKit, createMediaStreamSource } from '@snap/camera-kit';

(async function () {
  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzY1NDQxNTI5LCJzdWIiOiIzZjNkNGI4ZC0wNGRlLTRkMTQtYTQ1Ni1iMzVjZTkwZDRlNTh-U1RBR0lOR34wOTJiZmQ2Ny1hNGVhLTRmMDQtYTNkYS1jZGM4MmNjZGE5YTkifQ.MqrGTmxVteuROEdOPt6vKkEuxahGdCLUOalnGEcB8hs',
  });
  const liveRenderTarget = document.getElementById(
    'canvas'
  ) as HTMLCanvasElement;
  const session = await cameraKit.createSession({ liveRenderTarget });
  
  // Request access to the back-facing camera
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
  });

  // Create a media stream source with cameraType set to 'environment' for back camera
  const source = createMediaStreamSource(mediaStream, {
    cameraType: 'environment',
  });

  await session.setSource(source);
  await session.play();

  try {
    const lens = await cameraKit.lensRepository.loadLens(
      '4783cf00-4f42-420e-a822-1202ee9ec8c2',
      '0d9e6d69-838d-4aa2-b232-645c0880f09b'
    );

    await session.applyLens(lens);
    console.log('Lens applied successfully');
  } catch (error) {
    console.error('Failed to load or apply lens:', error);
    // Display error to user
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px 20px; border-radius: 8px; z-index: 10000; font-family: Arial, sans-serif; max-width: 80%; text-align: center;';
    errorDiv.textContent = `Lens failed to load: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the lens ID and group ID.`;
    document.body.appendChild(errorDiv);
  }
})();

