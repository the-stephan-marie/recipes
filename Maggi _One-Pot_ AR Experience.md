**Maggi "One-Pot" AR Experience**.  
*Maggi gives you everything you need in one pack.*

### **The Flow: "Add Me" Logic**

**1\. The Base (Water)**

* **Scene State:** Empty pot on a burner.  
* **Visual Hint:** The **"ADD ME"** indicator bounces above the **Water Jug**.  
* **User Action:** Tap the Jug.  
* **Animation:** The jug pours, triggering a rising water shader in the pot. Steam particles begin to rise.

**2\. The Substance (The Noodles)**

* **Scene State:** Water is boiling.  
* **Visual Hint:** The **"ADD ME"** indicator hovers over the **Maggi Noodle Cake**.  
* **User Action:** Tap the Cake.  
* **Animation:** The cake drops in. A "simmering" animation plays (using blend shapes/morph targets) to transition the stiff block into soft, wavy strands.

**3\. The Flavour (The Tastemaker)**

* **Scene State:** Noodles are in the pot.  
* **Visual Hint:** The **"ADD ME"** indicator jumps to the **Maggi Tastemaker Sachet**.  
* **User Action:** Tap the Sachet.  
* **Animation:** The sachet tears. Powder particles hit the water, and the liquid material lerps from clear to a rich golden-yellow broth.

**4\. The Crunch (Vegetables)**

* **Scene State:** Broth is ready and noodles are cooking.  
* **Visual Hint:** The **"ADD ME"** indicator appears over a **Bowl of Chopped Carrots & Peas**.  
* **User Action:** Tap the Bowl.  
* **Animation:** The vegetables scatter into the pot, floating on the surface to add color contrast. The experience ends with the final "Plated" shot.

---