// @component
// Tap-to-Advance Animation Controller
// Manages step-by-step animation playback based on mesh taps

@component
export class TapToAdvanceAnimation extends BaseScriptComponent {
    @input
    animationPlayer: AnimationPlayer;

    @input
    clipName: string = "Layer0";

    @input
    @hint("Animation frame rate (frames per second). Default: 30")
    frameRate: number = 30;

    @input
    @hint("InteractionComponent for detecting taps on meshes")
    interactionComponent: InteractionComponent;

    @input
    @hint("Camera for tap detection (auto-finds if not assigned)")
    @allowUndefined
    camera: Camera;

    // Step configuration
    private readonly steps = [
        {
            step: 1,
            meshNames: ["Nescafe_TOP__Copy_", "Nescafe_BTM"],
            startFrame: 0,
            endFrame: 60,
            description: "Add coffee sachet"
        },
        {
            step: 2,
            meshNames: ["pot", "tablespoon"],
            startFrame: 60,
            endFrame: 140,
            description: "Add spoon of hot water"
        },
        {
            step: 3,
            meshNames: ["jug"],
            startFrame: 140,
            endFrame: 200,
            description: "Add milk"
        },
        {
            step: 4,
            meshNames: ["mixing_bowl"],
            startFrame: 200,
            endFrame: 240,
            description: "Pour coffee mix into mug"
        },
        {
            step: 5,
            meshNames: ["scoop", "ice_bowl"],
            startFrame: 240,
            endFrame: 300,
            description: "Add ice"
        },
        {
            step: 6,
            meshNames: ["mug"],
            startFrame: 300,
            endFrame: 360,
            description: "Ready to sip"
        }
    ];

    private currentStep: number = 0;
    private isPlaying: boolean = false;
    private clip: AnimationClip | null = null;
    private updateEvent: any = null;
    private stepStartTime: number = 0;
    private stepDuration: number = 0;
    private meshObjects: Map<string, SceneObject[]> = new Map();
    
    // Visual marker system
    private originalColors: Map<RenderMeshVisual, vec4> = new Map();
    private highlightedMeshes: Set<RenderMeshVisual> = new Set();
    private glowUpdateEvent: any = null;
    private glowPulseTime: number = 0;
    private lastGlowUpdateTime: number = 0;
    
    // Camera cache
    private cachedCamera: Camera | null = null;

    onAwake(): void {
        if (!this.animationPlayer) {
            print("Error: AnimationPlayer not assigned!");
            return;
        }

        // Get the animation clip
        this.clip = this.animationPlayer.getClip(this.clipName);
        if (!this.clip) {
            print(`Error: Clip '${this.clipName}' not found!`);
            return;
        }

        // Set initial clip range and playback mode
        this.clip.begin = 0;
        this.clip.end = this.framesToSeconds(360);
        this.clip.playbackMode = 0; // Once

        // Build mesh object map
        this.buildMeshObjectMap();

        // Set up tap detection
        this.setupTapDetection();

        // Initialize visual markers for first step
        this.updateVisualMarkers();

        // Cache camera for tap detection
        this.cachedCamera = this.findCameraForTapDetection();

        print("TapToAdvanceAnimation initialized. Current step: 0 (waiting for Step 1)");
    }

    private buildMeshObjectMap(): void {
        // Get scene root by traversing up from current object
        let root: SceneObject = this.getSceneObject();
        let parent = root.getParent();
        while (parent) {
            root = parent;
            parent = parent.getParent();
        }

        // Collect all mesh names from steps
        const allMeshNames = new Set<string>();
        for (const step of this.steps) {
            for (const meshName of step.meshNames) {
                allMeshNames.add(meshName);
            }
        }

        // Search scene for objects with these mesh names
        this.searchAndCacheByMeshName(root, allMeshNames);
        
        print(`Cached objects for ${this.meshObjects.size} mesh names`);
        for (const [meshName, objects] of this.meshObjects) {
            print(`  Mesh '${meshName}': ${objects.length} object(s)`);
        }
    }

    private searchAndCacheByMeshName(obj: SceneObject, targetMeshes: Set<string>): void {
        // Check if this object's name matches a target mesh name
        const objName = obj.name;
        if (targetMeshes.has(objName)) {
            if (!this.meshObjects.has(objName)) {
                this.meshObjects.set(objName, []);
            }
            this.meshObjects.get(objName)!.push(obj);
        }

        // Also check if this object has a RenderMeshVisual with a matching mesh name
        const meshVisual = obj.getComponent("RenderMeshVisual") as RenderMeshVisual;
        if (meshVisual && meshVisual.mesh) {
            const meshName = meshVisual.mesh.name;
            if (targetMeshes.has(meshName)) {
                if (!this.meshObjects.has(meshName)) {
                    this.meshObjects.set(meshName, []);
                }
                // Only add if not already in the list
                const existing = this.meshObjects.get(meshName)!;
                if (existing.indexOf(obj) === -1) {
                    existing.push(obj);
                }
            }
        }

        // Recursively search children
        let childIndex = 0;
        let child: SceneObject | null = null;
        try {
            child = obj.getChild(childIndex);
            while (child != null && child != undefined) {
                this.searchAndCacheByMeshName(child, targetMeshes);
                childIndex++;
                child = obj.getChild(childIndex);
            }
        } catch (e) {
            // Stop iterating on error
        }
    }

    private setupTapDetection(): void {
        // Use TapEvent and detect which mesh was tapped using InteractionComponent
        this.createEvent("TapEvent").bind((event: TapEvent) => {
            this.onTap(event);
        });
    }

    private onTap(event: TapEvent): void {
        if (this.isPlaying) {
            print("Animation is already playing. Please wait.");
            return;
        }

        if (this.currentStep >= this.steps.length) {
            print("All steps completed! Animation finished.");
            return;
        }

        // Detect which mesh was tapped using InteractionComponent
        const tappedMesh = this.detectTappedMesh(event);
        if (!tappedMesh) {
            print("No target mesh detected at tap location.");
            return;
        }

        print(`Tapped mesh: ${tappedMesh}`);

        // Get the next step we're waiting for
        const nextStep = this.steps[this.currentStep];
        
        // Check if this mesh belongs to the current step
        if (!nextStep.meshNames.includes(tappedMesh)) {
            print(`Wrong mesh! Expected one of: ${nextStep.meshNames.join(", ")}`);
            print(`You tapped mesh: ${tappedMesh}`);
            return;
        }

        // Valid tap - remove highlight from tapped mesh
        this.removeHighlightFromMesh(tappedMesh);
        
        // Advance to next step
        print(`Step ${this.currentStep + 1} triggered: ${nextStep.description}`);
        this.currentStep++;
        
        this.playStep(this.currentStep);
    }

    private findCameraForTapDetection(): Camera | null {
        // First priority: Use input camera if assigned
        if (this.camera) {
            print("Camera found via input field");
            return this.camera;
        }
        
        // Second priority: Try to get camera from InteractionComponent
        if (this.interactionComponent) {
            try {
                const interactionCam = (this.interactionComponent as any).camera;
                if (interactionCam) {
                    print("Camera found via InteractionComponent");
                    return interactionCam;
                }
            } catch (e) {
                print(`Error accessing InteractionComponent camera: ${e}`);
            }
        }
        
        // Third priority: Try to find Camera Object by name
        let root: SceneObject = this.getSceneObject();
        let parent = root.getParent();
        while (parent) {
            root = parent;
            parent = parent.getParent();
        }
        
        const cameraObject = this.findSceneObjectByName(root, "Camera Object");
        if (cameraObject) {
            const foundCamera = cameraObject.getComponent("Camera") as Camera;
            if (foundCamera) {
                print("Camera found via Camera Object name search");
                return foundCamera;
            }
        }
        
        // Fallback: Search scene for camera component
        const foundCamera = this.findCamera(root);
        if (foundCamera) {
            print("Camera found via scene search");
        } else {
            print("Warning: No camera found in scene!");
        }
        return foundCamera;
    }

    private detectTappedMesh(event: TapEvent): string | null {
        // Use cached camera or try to find it again
        let cam: Camera | null = this.cachedCamera;
        
        if (!cam) {
            cam = this.findCameraForTapDetection();
            this.cachedCamera = cam;
        }

        if (!cam) {
            print("Error: No camera found for tap detection!");
            return null;
        }

        // Get tap position in screen space (0-1 range)
        const tapPos = event.getTapPosition();
        if (!tapPos) {
            print("Error: Could not get tap position");
            return null;
        }

        // Convert screen space to world space ray
        const rayOrigin = cam.screenSpaceToWorldSpace(tapPos, 0.1);
        const rayEnd = cam.screenSpaceToWorldSpace(tapPos, 1000.0);
        
        // Calculate ray direction
        const rayDir = new vec3(
            rayEnd.x - rayOrigin.x,
            rayEnd.y - rayOrigin.y,
            rayEnd.z - rayOrigin.z
        );
        const rayLength = rayDir.length;
        if (rayLength < 0.001) {
            return null;
        }
        const rayDirNormalized = new vec3(
            rayDir.x / rayLength,
            rayDir.y / rayLength,
            rayDir.z / rayLength
        );
        
        // Perform raycast to find which mesh was hit
        // Use screen-space distance as primary criteria for accuracy
        let closestHit: { 
            meshName: string; 
            screenDistance: number; 
            rayDistance: number;
            distanceFromRay: number;
        } | null = null;
        const maxDistance = 1000.0;
        const maxScreenDistance = 0.3; // Maximum screen-space distance (0-1 range) to consider a hit
        const hitThreshold = 10.0; // Maximum world-space distance from ray to object center

        for (const [meshName, objects] of this.meshObjects) {
            for (const obj of objects) {
                if (!obj.enabled) {
                    continue;
                }

                // Get the RenderMeshVisual component
                const meshVisual = obj.getComponent("RenderMeshVisual") as RenderMeshVisual;
                if (!meshVisual || !meshVisual.mesh) {
                    continue;
                }

                // Get object position and approximate size
                const objPos = obj.getTransform().getWorldPosition();
                const objScale = obj.getTransform().getWorldScale();
                const objSize = Math.max(objScale.x, Math.max(objScale.y, objScale.z));
                
                // Convert object position to screen space
                const objScreenPos = cam.worldSpaceToScreenSpace(objPos);
                if (!objScreenPos) {
                    continue;
                }
                
                // Calculate screen-space distance from tap to object
                const screenDx = objScreenPos.x - tapPos.x;
                const screenDy = objScreenPos.y - tapPos.y;
                const screenDistance = Math.sqrt(screenDx * screenDx + screenDy * screenDy);
                
                // Skip if object is too far in screen space
                if (screenDistance > maxScreenDistance) {
                    continue;
                }
                
                // Calculate vector from ray origin to object center
                const toObject = new vec3(
                    objPos.x - rayOrigin.x,
                    objPos.y - rayOrigin.y,
                    objPos.z - rayOrigin.z
                );
                
                // Project toObject onto ray direction to find closest point on ray
                const projection = toObject.x * rayDirNormalized.x + 
                                 toObject.y * rayDirNormalized.y + 
                                 toObject.z * rayDirNormalized.z;
                
                // Check if object is in front of camera
                if (projection <= 0) {
                    continue;
                }
                
                // Clamp projection to ray bounds (0 to rayLength)
                const clampedProjection = Math.max(0, Math.min(projection, rayLength));
                
                // Calculate closest point on ray to object
                const closestPointOnRay = new vec3(
                    rayOrigin.x + rayDirNormalized.x * clampedProjection,
                    rayOrigin.y + rayDirNormalized.y * clampedProjection,
                    rayOrigin.z + rayDirNormalized.z * clampedProjection
                );
                
                // Calculate distance from closest point on ray to object center
                const dx = objPos.x - closestPointOnRay.x;
                const dy = objPos.y - closestPointOnRay.y;
                const dz = objPos.z - closestPointOnRay.z;
                const distanceFromRay = Math.sqrt(dx * dx + dy * dy + dz * dz);
                
                // Check if object is within hit threshold (considering object size)
                // Use larger multiplier for big objects to make them easier to tap
                const effectiveThreshold = hitThreshold + objSize * 1.0;
                if (distanceFromRay < effectiveThreshold && clampedProjection < maxDistance) {
                    // Prioritize by screen-space distance first, then ray distance
                    if (!closestHit || 
                        screenDistance < closestHit.screenDistance ||
                        (Math.abs(screenDistance - closestHit.screenDistance) < 0.01 && 
                         clampedProjection < closestHit.rayDistance)) {
                        closestHit = { 
                            meshName: meshName, 
                            screenDistance: screenDistance,
                            rayDistance: clampedProjection,
                            distanceFromRay: distanceFromRay
                        };
                    }
                }
            }
        }

        return closestHit ? closestHit.meshName : null;
    }

    private findCamera(root: SceneObject): Camera | null {
        // Search for camera component in scene
        let childIndex = 0;
        let child: SceneObject | null = null;
        try {
            child = root.getChild(childIndex);
            while (child != null && child != undefined) {
                const camera = child.getComponent("Camera") as Camera;
                if (camera) {
                    return camera;
                }
                // Recursively search children
                const foundCamera = this.findCamera(child);
                if (foundCamera) {
                    return foundCamera;
                }
                childIndex++;
                child = root.getChild(childIndex);
            }
        } catch (e) {
            // Stop iterating on error
        }
        return null;
    }

    private playStep(stepNumber: number): void {
        if (stepNumber < 1 || stepNumber > this.steps.length) {
            print(`Invalid step number: ${stepNumber}`);
            return;
        }

        const step = this.steps[stepNumber - 1];
        print(`Playing Step ${stepNumber}: ${step.description} (frames ${step.startFrame}-${step.endFrame})`);

        if (!this.clip) {
            print("Error: Animation clip not found!");
            return;
        }

        // Convert frames to seconds
        const startTime = this.framesToSeconds(step.startFrame);
        const endTime = this.framesToSeconds(step.endFrame);

        // Set the animation range
        this.clip.begin = startTime;
        this.clip.end = endTime;
        this.clip.playbackMode = 0; // Once - don't loop

        // Calculate duration for this step
        this.stepDuration = endTime - startTime;
        this.stepStartTime = getTime();

        // Play the animation
        this.isPlaying = true;
        this.animationPlayer.playClip(this.clipName);

        // Set up update event to check for completion
        if (!this.updateEvent) {
            this.updateEvent = this.createEvent("UpdateEvent");
            this.updateEvent.bind(this.checkAnimationComplete.bind(this));
        }
        this.updateEvent.enabled = true;
    }

    private checkAnimationComplete(): void {
        if (!this.isPlaying) {
            return;
        }

        const elapsedTime = getTime() - this.stepStartTime;
        
        if (elapsedTime >= this.stepDuration) {
            this.isPlaying = false;
            if (this.updateEvent) {
                this.updateEvent.enabled = false;
            }
            
            print(`Step ${this.currentStep} completed!`);

            if (this.currentStep >= this.steps.length) {
                print("All steps completed! Animation finished at frame 360.");
                // Remove all highlights when finished
                this.removeAllHighlights();
            } else {
                const nextStep = this.steps[this.currentStep];
                if (nextStep) {
                    print(`Ready for Step ${this.currentStep + 1}: ${nextStep.description}`);
                    print(`Tap on mesh: ${nextStep.meshNames.join(" or ")}`);
                    // Update visual markers for next step
                    this.updateVisualMarkers();
                }
            }
        }
    }

    private framesToSeconds(frames: number): number {
        return frames / this.frameRate;
    }

    // Visual marker methods
    private updateVisualMarkers(): void {
        // Remove highlights from previous step
        this.removeAllHighlights();

        // If animation is playing, don't highlight
        if (this.isPlaying || this.currentStep >= this.steps.length) {
            return;
        }

        // Highlight meshes for current step
        const currentStep = this.steps[this.currentStep];
        if (currentStep) {
            for (const meshName of currentStep.meshNames) {
                this.highlightMesh(meshName);
            }
        }

        // Set up pulsing glow animation
        this.setupGlowAnimation();
    }

    private highlightMesh(meshName: string): void {
        const objects = this.meshObjects.get(meshName);
        if (!objects) {
            return;
        }

        for (const obj of objects) {
            if (!obj.enabled) {
                continue;
            }

            const meshVisual = obj.getComponent("RenderMeshVisual") as RenderMeshVisual;
            if (!meshVisual || !meshVisual.mainMaterial) {
                continue;
            }

            // Store original color if not already stored
            if (!this.originalColors.has(meshVisual)) {
                const material = meshVisual.mainMaterial;
                if (material) {
                    const materialAny: any = material;
                    if (materialAny.passInfos && materialAny.passInfos.length > 0) {
                        const passInfo = materialAny.passInfos[0];
                        const propertyNames = passInfo.getPropertyNames();
                        
                        // Try to get baseColor property
                        if (propertyNames.indexOf("baseColor") >= 0) {
                            const baseColor = (passInfo as any).baseColor as vec4;
                            if (baseColor) {
                                this.originalColors.set(meshVisual, baseColor);
                            }
                        }
                    }
                }
            }

            // Add to highlighted set
            this.highlightedMeshes.add(meshVisual);
        }
    }

    private removeHighlightFromMesh(meshName: string): void {
        const objects = this.meshObjects.get(meshName);
        if (!objects) {
            return;
        }

        for (const obj of objects) {
            const meshVisual = obj.getComponent("RenderMeshVisual") as RenderMeshVisual;
            if (meshVisual && this.highlightedMeshes.has(meshVisual)) {
                this.restoreOriginalColor(meshVisual);
                this.highlightedMeshes.delete(meshVisual);
            }
        }
    }

    private removeAllHighlights(): void {
        for (const meshVisual of this.highlightedMeshes) {
            this.restoreOriginalColor(meshVisual);
        }
        this.highlightedMeshes.clear();
        
        // Disable glow animation
        if (this.glowUpdateEvent) {
            this.glowUpdateEvent.enabled = false;
        }
    }

    private restoreOriginalColor(meshVisual: RenderMeshVisual): void {
        const originalColor = this.originalColors.get(meshVisual);
        if (!originalColor) {
            return;
        }

        const material = meshVisual.mainMaterial;
        if (!material) {
            return;
        }
        const materialAny: any = material;
        if (!materialAny.passInfos || materialAny.passInfos.length === 0) {
            return;
        }

        const passInfo = materialAny.passInfos[0];
        const propertyNames = passInfo.getPropertyNames();
        
        if (propertyNames.indexOf("baseColor") >= 0) {
            (passInfo as any).baseColor = originalColor;
        }
    }

    private setupGlowAnimation(): void {
        if (!this.glowUpdateEvent) {
            this.glowUpdateEvent = this.createEvent("UpdateEvent");
            this.glowUpdateEvent.bind(this.updateGlowPulse.bind(this));
        }
        this.glowPulseTime = 0;
        this.lastGlowUpdateTime = getTime();
        this.glowUpdateEvent.enabled = true;
    }

    private updateGlowPulse(): void {
        if (this.highlightedMeshes.size === 0 || this.isPlaying) {
            if (this.glowUpdateEvent) {
                this.glowUpdateEvent.enabled = false;
            }
            return;
        }

        // Update pulse time using delta time
        const currentTime = getTime();
        const deltaTime = this.lastGlowUpdateTime > 0 ? currentTime - this.lastGlowUpdateTime : 0.016; // Default to ~60fps
        this.lastGlowUpdateTime = currentTime;
        this.glowPulseTime += deltaTime;
        
        // Create pulsing glow effect (oscillates between 0.3 and 1.0 intensity)
        const pulseSpeed = 2.0; // pulses per second
        const pulseValue = (Math.sin(this.glowPulseTime * pulseSpeed * Math.PI * 2) + 1.0) * 0.5;
        const glowIntensity = 0.3 + pulseValue * 0.7; // Range: 0.3 to 1.0

        // Apply glow to all highlighted meshes
        for (const meshVisual of this.highlightedMeshes) {
            const material = meshVisual.mainMaterial;
            if (!material) {
                continue;
            }
            const materialAny: any = material;
            if (!materialAny.passInfos || materialAny.passInfos.length === 0) {
                continue;
            }

            const passInfo = materialAny.passInfos[0];
            const propertyNames = passInfo.getPropertyNames();
            
            if (propertyNames.indexOf("baseColor") >= 0) {
                const originalColor = this.originalColors.get(meshVisual);
                if (originalColor) {
                    // Create glowing yellow/white color
                    const glowColor = new vec4(
                        Math.min(originalColor.x + 0.5 * glowIntensity, 1.0),
                        Math.min(originalColor.y + 0.5 * glowIntensity, 1.0),
                        Math.min(originalColor.z + 0.3 * glowIntensity, 1.0),
                        originalColor.w
                    );
                    (passInfo as any).baseColor = glowColor;
                }
            }
        }
    }

    private findSceneObjectByName(obj: SceneObject, name: string): SceneObject | null {
        if (obj.name === name) {
            return obj;
        }

        let childIndex = 0;
        let child: SceneObject | null = null;
        try {
            child = obj.getChild(childIndex);
            while (child != null && child != undefined) {
                const found = this.findSceneObjectByName(child, name);
                if (found) {
                    return found;
                }
                childIndex++;
                child = obj.getChild(childIndex);
            }
        } catch (e) {
            // Stop iterating on error
        }
        return null;
    }
}

