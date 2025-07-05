import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8EI4mR0ojGiCLFtugipupz0VYwMtscfY",
  authDomain: "ecoprecios-tapalque.firebaseapp.com",
  projectId: "ecoprecios-tapalque",
  storageBucket: "ecoprecios-tapalque.firebasestorage.app",
  messagingSenderId: "1041851629735",
  appId: "1:1041851629735:web:dcf468541c30d89c211b82"
};

// Inicializo Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('form-agregar');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const marca = document.getElementById('marca').value.trim();
  const supermercado = document.getElementById('supermercado').value;
  const precio = parseFloat(document.getElementById('precio').value);

  if (!nombre || !marca || !supermercado || !precio || precio <= 0) {
    alert("Por favor completá todos los campos correctamente.");
    return;
  }

  try {
    await addDoc(collection(db, 'productos'), {
      nombre,
      marca,
      supermercado,
      precio,
      fechaCreacion: serverTimestamp()
    });

    alert('Producto agregado con éxito!');
    form.reset();
  } catch (error) {
    console.error("Error agregando producto: ", error);
    alert('Error al agregar producto. Intentá nuevamente.');
  }
});