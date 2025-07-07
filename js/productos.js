import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8EI4mR0ojGiCLFtugipz0VYwMtscfY",
  authDomain: "ecoprecios-tapalque.firebaseapp.com",
  projectId: "ecoprecios-tapalque",
  storageBucket: "ecoprecios-tapalque.firebasestorage.app",
  messagingSenderId: "1041851629735",
  appId: "1:1041851629735:web:dcf468541c30d89c211b82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listaProductos = document.getElementById("lista-productos");
const buscador = document.getElementById("buscador");

// Definir supermercados disponibles (igual que en agregar productos)
const supermercadosDisponibles = [
  "Supermercado AS",
  "Supermercado ET",
  "Supermercado XYZ",
  "Supermercado ABC"
  // Agregá acá todos los que uses
];

// Mostrar productos con filtro (nombre o marca)
async function mostrarProductos(filtro = "") {
  listaProductos.innerHTML = "Cargando productos...";

  try {
    const productosRef = collection(db, "productos");
    const q = query(productosRef, orderBy("nombre"));
    const snapshot = await getDocs(q);

    let productos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (
        data.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        data.marca.toLowerCase().includes(filtro.toLowerCase())
      ) {
        productos.push({ ...data, id: doc.id });
      }
    });

    if (productos.length === 0) {
      listaProductos.innerHTML = "<p>No se encontraron productos.</p>";
      return;
    }

    listaProductos.innerHTML = productos
      .map(prod => {
        const preciosHTML = prod.precios
          .map(
            p => `
              <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${p.supermercado}</span>
                <span>$${p.precio.toFixed(2)}</span>
              </li>`
          )
          .join("");

        return `
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${prod.nombre} <small class="text-muted">(${prod.marca})</small></h5>
              <ul class="list-group mb-2">
                ${preciosHTML}
              </ul>
              <button class="btn btn-sm btn-outline-secondary btn-editar" data-id="${prod.id}">Editar</button>
            </div>
          </div>
        `;
      })
      .join("");

  } catch (error) {
    console.error("Error cargando productos:", error);
    listaProductos.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

mostrarProductos();

buscador.addEventListener("input", (e) => {
  mostrarProductos(e.target.value);
});

// Escuchar clic en botón editar
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-editar")) {
    const id = e.target.dataset.id;
    const ref = doc(db, "productos", id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();

    // Llenar formulario modal con datos actuales
    document.getElementById("edit-id").value = id;
    document.getElementById("edit-nombre").value = data.nombre;
    document.getElementById("edit-marca").value = data.marca;

    const preciosContainer = document.getElementById("precios-existentes");

    // Generar inputs para precios existentes con selects de supermercado
    preciosContainer.innerHTML = data.precios.map((p, i) => {
      const opcionesSelect = supermercadosDisponibles
        .map(sup => `<option value="${sup}" ${sup === p.supermercado ? "selected" : ""}>${sup}</option>`)
        .join("");

      return `
        <div class="mb-2 row align-items-center">
          <div class="col-6">
            <select class="form-select supermercado-input" data-index="${i}" required>
              ${opcionesSelect}
            </select>
          </div>
          <div class="col-4">
            <input type="number" class="form-control precio-input" data-index="${i}" value="${p.precio}" min="0" step="0.01" required>
          </div>
          <div class="col-2">
            <button type="button" class="btn btn-danger btn-eliminar-precio" data-index="${i}">&times;</button>
          </div>
        </div>
      `;
    }).join("");

    // Llenar el select de nuevo supermercado en el formulario
    const nuevoSuperSelect = document.getElementById("nuevo-supermercado");
    nuevoSuperSelect.innerHTML = `<option value="">Seleccionar supermercado</option>` +
      supermercadosDisponibles.map(sup => `<option value="${sup}">${sup}</option>`).join("");

    // Limpiar precio nuevo
    document.getElementById("nuevo-precio").value = "";

    // Mostrar modal bootstrap
    const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
    modal.show();
  }
});

// Eliminar un precio cuando se presiona el botón "x"
document.getElementById("precios-existentes").addEventListener("click", (e) => {
  if (e.target.classList.contains("btn-eliminar-precio")) {
    const idx = parseInt(e.target.dataset.index);
    const preciosContainer = document.getElementById("precios-existentes");

    // Remover el div padre del botón
    e.target.closest("div.row").remove();

    // Nota: para simplificar, el input no se sincroniza inmediatamente aquí,
    // se actualiza al guardar (se recogen todos los selects e inputs restantes).
  }
});

// Guardar cambios edición producto
document.getElementById("form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-id").value;
  const ref = doc(db, "productos", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const nuevoNombre = document.getElementById("edit-nombre").value.trim();
  const nuevaMarca = document.getElementById("edit-marca").value.trim();

  // Recopilar precios existentes que quedaron visibles
  const preciosContainer = document.getElementById("precios-existentes");
  const supermercadoInputs = preciosContainer.querySelectorAll(".supermercado-input");
  const precioInputs = preciosContainer.querySelectorAll(".precio-input");

  const nuevosPrecios = [];
  for (let i = 0; i < supermercadoInputs.length; i++) {
    const supermercado = supermercadoInputs[i].value.trim();
    const precio = parseFloat(precioInputs[i].value);
    if (supermercado && precio > 0) {
      nuevosPrecios.push({ supermercado, precio });
    }
  }

  // Nuevo precio agregado desde el formulario
  const nuevoSuper = document.getElementById("nuevo-supermercado").value.trim();
  const nuevoPrecio = parseFloat(document.getElementById("nuevo-precio").value);
  if (nuevoSuper && nuevoPrecio > 0) {
    nuevosPrecios.push({ supermercado: nuevoSuper, precio: nuevoPrecio });
  }

  try {
    await updateDoc(ref, {
      nombre: nuevoNombre,
      marca: nuevaMarca,
      precios: nuevosPrecios
    });

    alert("Producto actualizado correctamente.");
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditar"));
    modal.hide();
    mostrarProductos();
  } catch (error) {
    console.error("Error actualizando producto:", error);
    alert("Error al actualizar el producto.");
  }
});
