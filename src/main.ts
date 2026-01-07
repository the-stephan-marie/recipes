import { bootstrapCameraKit } from '@snap/camera-kit';

(async function () {
  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzY1NDQxNTI5LCJzdWIiOiIzZjNkNGI4ZC0wNGRlLTRkMTQtYTQ1Ni1iMzVjZTkwZDRlNTh-U1RBR0lOR34wOTJiZmQ2Ny1hNGVhLTRmMDQtYTNkYS1jZGM4MmNjZGE5YTkifQ.MqrGTmxVteuROEdOPt6vKkEuxahGdCLUOalnGEcB8hs',
  });
  const liveRenderTarget = document.getElementById(
    'canvas'
  ) as HTMLCanvasElement;
  const session = await cameraKit.createSession({ liveRenderTarget });
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  await session.setSource(mediaStream);
  await session.play();

  const lens = await cameraKit.lensRepository.loadLens(
    '49414230875',
    '283c82db-586c-4f87-96f9-67d045824385'
  );

  await session.applyLens(lens);
})();

