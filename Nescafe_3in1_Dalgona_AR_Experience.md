Based on the **Nescafé 3in1 Dalgona Coffee** recipe, this is a perfect candidate for a "Mini-Game" style AR experience.

The core of Dalgona is the **whipping** process. This allows us to introduce a new mechanic: **"Rapid Tap to Whip."**

### 1. The Experience Flow (The "Whisk & Pour" Challenge)

**Scene Setup:**
Unlike the previous recipe, this one requires **two containers**:

1. **The Mixing Bowl** (Floating in AR space or on the table).
2. **The Serving Mug** (The Branded Opaque Mug).

**Step 1: The Mix (Bowl)**

* *Action:* User taps **Nescafé 3in1 Sachet** and **Hot Water** (1 tbsp).
* *Visual:* Powder and a tiny splash of water land in the bowl.

**Step 2: The Whip (Gamified Interaction)**

* *Instruction:* "Tap fast to whip the foam!"
* *Mechanic:* A progress bar appears. The user must tap the screen repeatedly.
* *Visual (Morph):* As the bar fills, the dark liquid in the bowl rises, lightens in color (to beige), and thickens into a stiff peak foam using a Blend Shape.

**Step 3: The Base (Mug)**

* *Instruction:* "Prepare the glass."
* *Action:* User taps **Ice Cubes** and **Milk Jug**.
* *Visual:* Ice falls into the opaque mug (clinking sound), followed by liquid milk filling it 3/4 full.

**Step 4: The Transfer (The "Dollop")**

* *Instruction:* "Top it off."
* *Action:* User swipes from the Bowl to the Mug.
* *Visual:* The bowl tilts, and the thick foam "blobs" onto the top of the milk, sitting high above the rim.

---

### 2. Technical Implementation Plan

#### A. Asset Requirements

* **Mixing Bowl:** Simple clear glass bowl (C4D).
* **Whisk:** Animated object (Optional, can just be a sound effect + motion blur).
* **Foam Geometry:**
* **State A (Liquid):** Flat dark puddle.
* **State B (Foam):** Tall, billowy, textured cloud.
* **Technique:** Use a **Blend Shape** (Morph Target) to transition from A to B while changing the texture color from Dark Brown to Golden Beige.


* **The "Dollop" (Final Topping):** A separate mesh that looks like the finished foam cap.

#### B. The "Whip" Logic (Lens Studio Script)

You need a script that listens for rapid input and drives the Blend Shape weight.

```javascript
// DalgonaWhip.js

// @input Component.RenderMeshVisual foamMesh
// @input SceneObject whisk
// @input Component.AudioComponent whipSound

var progress = 0.0;
var decay = 0.005; // Bar goes down if you stop tapping (Game feel!)

function onUpdate(eventData) {
    // Decay progress if user stops tapping
    if (progress > 0) progress -= decay;
    if (progress < 0) progress = 0;
    
    // Update Morph Weight
    foamMesh.setBlendShapeWeight("FoamRise", progress);
    
    // Rotate Whisk based on progress
    if (progress > 0.1) {
        whisk.getTransform().setLocalRotation( ... ); // Spin logic
    }
}

function onTap() {
    progress += 0.1; // Add 10% progress per tap
    whipSound.play(1);
    
    if (progress >= 1.0) {
        finishWhippingPhase();
    }
}

```

#### C. The Transfer Trick (Mug Logic)

Since the mug is opaque, Step 3 (Milk + Ice) is easy:

1. **Ice:** Spawn 3 cube physics objects that fall in.
2. **Milk:** Use the "Piston" cylinder method from the previous recipe, but stop it at 75% height.

**For Step 4 (The Foam Topping):**
Since transferring dynamic fluid is hard, fake it.

1. **Hide** the foam in the bowl (Scale to 0).
2. **Spawn** a falling "Foam Blob" object above the mug.
3. **Landing:** When it hits the mug rim, swap it for a static "Perfect Dalgona Cap" mesh that sits beautifully on top.

### 3. Comparison to Previous Workflow

* **New Challenge:** The **Color Change** (Dark Coffee -> Light Beige) is critical for Dalgona. In Lens Studio, animate the `Base Color` of the material at the same time you drive the Blend Shape.
* **Optimization:** Reuse the **Ice Cubes** and **Milk Jug** from your general asset library. The only custom asset here is the **Foam Morph**.

**Would you like to know how to set up the material shader to transition from Dark Brown to Golden Beige based on the "Whip Progress" variable?**