import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8EI4mR0ojGiCLFtugipupz0VYwMtscfY",
  authDomain: "ecoprecios-tapalque.firebaseapp.com",
  projectId: "ecoprecios-tapalque",
  storageBucket: "ecoprecios-tapalque.firebasestorage.app",
  messagingSenderId: "1041851629735",
  appId: "1:1041851629735:web:dcf468541c30d89c211b82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("form-agregar");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const marca = document.getElementById("marca").value.trim();
  const supermercado = document.getElementById("supermercado").value;
  const precio = parseFloat(document.getElementById("precio").value);

  if (!nombre || !marca || !supermercado || !precio || precio <= 0) {
    alert("Por favor completá todos los campos correctamente.");
    return;
  }

  // ID del producto = nombre-marca (sin espacios ni mayúsculas)
  const productoId = `${nombre.toLowerCase().replace(/\s+/g, "-")}_${marca
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  const productoRef = doc(db, "productos", productoId);
  const productoSnap = await getDoc(productoRef);

try {
  if (productoSnap.exists()) {
    const data = productoSnap.data();
    const precios = data.precios || [];

    const yaExiste = precios.find(p => p.supermercado === supermercado);

    if (yaExiste) {
      const nuevosPrecios = precios.map(p =>
        p.supermercado === supermercado
          ? { ...p, precio } // sin fecha
          : p
      );

      await updateDoc(productoRef, {
        precios: nuevosPrecios
      });
    } else {
      await updateDoc(productoRef, {
        precios: arrayUnion({
          supermercado,
          precio
          // sin fecha
        })
      });
    }
  } else {
    await setDoc(productoRef, {
      nombre,
      marca,
      precios: [
        {
          supermercado,
          precio
        }
      ],
      fechaCreacion: serverTimestamp() // fecha del documento sí
    });
  }

  alert("Producto actualizado o agregado con éxito!");
  form.reset();
} catch (error) {
  console.error("Error al guardar producto:", error);
  alert("Ocurrió un error al guardar el producto.");
}
});