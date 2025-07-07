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

// Función para generar ID consistente para un producto
function generarProductoId(nombre, marca) {
  return `${nombre.toLowerCase().replace(/\s+/g, "-")}_${marca.toLowerCase().replace(/\s+/g, "-")}`;
}

async function mostrarProductos(filtro = "") {
  listaProductos.innerHTML = "Cargando productos...";

  try {
    const productosRef = collection(db, "productos");
    const q = query(productosRef, orderBy("nombre"));

    const snapshot = await getDocs(q);

    let productos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.nombre.toLowerCase().includes(filtro.toLowerCase())) {
        productos.push({ id: doc.id, ...data });
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
            p =>
              `<li class="list-group-item d-flex justify-content-between align-items-center">
                <span>${p.supermercado}</span>
                <span>
                  $${p.precio.toFixed(2)}
                </span>
              </li>`
          )
          .join("");

        return `
          <div class="card mb-3" data-producto-id="${prod.id}">
            <div class="card-body">
              <h5 class="card-title">${prod.nombre} <small class="text-muted">(${prod.marca})</small></h5>
              <ul class="list-group mb-3">
                ${preciosHTML}
              </ul>
              <button class="btn btn-sm btn-outline-warning editar-producto-btn">Editar</button>
            </div>
          </div>
        `;
      })
      .join("");

    // Agregar event listeners para los botones Editar producto
    listaProductos.querySelectorAll(".editar-producto-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const card = btn.closest(".card");
        const productoId = card.dataset.productoId;
        const productoRef = doc(db, "productos", productoId);
        const productoSnap = await getDoc(productoRef);

        if (!productoSnap.exists()) {
          alert("Producto no encontrado");
          return;
        }

        const productoData = productoSnap.data();

        // Pedir nuevo nombre y marca
        const nuevoNombre = prompt("Editar nombre del producto:", productoData.nombre);
        if (!nuevoNombre) {
          alert("Nombre inválido.");
          return;
        }
        const nuevaMarca = prompt("Editar marca del producto:", productoData.marca);
        if (!nuevaMarca) {
          alert("Marca inválida.");
          return;
        }

        // Editar precios
        let nuevosPrecios = [];
        for (const precio of productoData.precios) {
          const nuevoPrecioStr = prompt(`Editar precio en ${precio.supermercado}:`, precio.precio);
          const nuevoPrecio = parseFloat(nuevoPrecioStr);
          if (!nuevoPrecio || nuevoPrecio <= 0) {
            alert(`Precio inválido para ${precio.supermercado}. Se mantendrá el precio anterior.`);
            nuevosPrecios.push(precio);
          } else {
            nuevosPrecios.push({ supermercado: precio.supermercado, precio: nuevoPrecio });
          }
        }

        // Actualizar doc en Firestore
        try {
          // Si cambió el nombre o la marca, debemos cambiar el ID también:
          const nuevoId = generarProductoId(nuevoNombre, nuevaMarca);

          if (nuevoId !== productoId) {
            // Copiar con nuevo ID y borrar el viejo (no hay rename directo)
            const nuevoProductoRef = doc(db, "productos", nuevoId);
            await updateDoc(nuevoProductoRef, {
              nombre: nuevoNombre,
              marca: nuevaMarca,
              precios: nuevosPrecios
            });

            // Luego borramos el viejo documento (requiere permisos de escritura)
            // Para simplificar y evitar borrar antes, se podría hacer con funciones server-side, pero aquí una opción:
            // await deleteDoc(productoRef);

            alert("Producto editado! (Recarga para ver cambios si cambiaste nombre o marca)");
          } else {
            // Solo actualizar el mismo documento
            await updateDoc(productoRef, {
              nombre: nuevoNombre,
              marca: nuevaMarca,
              precios: nuevosPrecios
            });
            alert("Producto editado correctamente!");
          }

          mostrarProductos(buscador.value); // refrescar lista

        } catch (error) {
          console.error("Error actualizando producto:", error);
          alert("Ocurrió un error al actualizar el producto.");
        }
      });
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
    listaProductos.innerHTML = "<p>Error al cargar productos.</p>";
  }
}

mostrarProductos();

buscador.addEventListener("input", (e) => {
  mostrarProductos(e.target.value);
});