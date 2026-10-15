export const products = [
  {
    id: "vader",
    name: "Darth Vader · Imperial Dark Lord",
    category: "LEGO",
    universe: "Star Wars",
    price: 1450,
    stock: 3,
    image: "vader.jpg",
    tag: "FAVORITO DE LA BÓVEDA",
    condition: "Minifigura sin caja",
    edition: "SW1249",
    description:
      "El lado oscuro, en su forma más coleccionable. Minifigura de Darth Vader con casco de dos piezas, capa y detalles impresos en el torso. Una presencia imprescindible en cualquier vitrina de Star Wars.",
  },
  {
    id: "boba",
    name: "Boba Fett · Bounty Hunter",
    category: "LEGO",
    universe: "Star Wars",
    price: 980,
    stock: 5,
    image: "boba.jpeg",
    tag: "ÚLTIMAS PIEZAS",
    condition: "Minifigura suelta",
    edition: "Boba Fett con bláster",
    description:
      "El cazarrecompensas más reconocible de la galaxia. Armadura mandaloriana, casco y bláster en una minifigura que reúne todos los detalles de un personaje de culto.",
  },
  {
    id: "charizard",
    name: "Charizard Holo · Base Set 1999",
    category: "TCG",
    universe: "Pokémon",
    price: 18500,
    stock: 1,
    image: "charizard.png",
    tag: "PIEZA DE COLECCIÓN",
    condition: "Encapsulada · referencia PSA 8",
    edition: "Base Set · 4/102 · inglés",
    description:
      "El inicio de toda una obsesión. Charizard holográfico del Base Set de 1999, una de las cartas más reconocibles del coleccionismo Pokémon. Imagen de referencia de una pieza encapsulada; la ficha pertenece al catálogo de demostración.",
  },
  {
    id: "batman",
    name: "Batman · Sixth Scale",
    category: "Figuras",
    universe: "DC Comics",
    price: 6900,
    stock: 2,
    image: "batman.jpg",
    tag: "SELECCIÓN VAULT",
    condition: "Figura de exhibición",
    edition: "Sideshow · escala 1:6",
    description:
      "La silueta del Caballero de la Noche, llevada a una pieza de exhibición a escala 1:6. Una figura de Sideshow para quienes reservan el mejor lugar de su colección a Gotham.",
  },
  {
    id: "spiderman",
    name: "Spider-Man · No Way Home",
    category: "Figuras",
    universe: "Marvel",
    price: 1250,
    stock: 6,
    image: "spiderman.jpg",
    tag: "EN LA COLECCIÓN",
    condition: "Con empaque",
    edition: "Hasbro · Marvel Legends",
    description:
      "Tu amigable vecino, listo para la vitrina. Figura de la línea Marvel Legends inspirada en Spider-Man: No Way Home, con articulaciones para recrear sus poses más características.",
  },
  {
    id: "lux",
    name: "Gavin Lux · Signed Baseball",
    category: "Memorabilia",
    universe: "MLB · Dodgers",
    price: 3200,
    stock: 2,
    image: "lux.jpg",
    tag: "MEMORABILIA",
    condition: "Con caja de exhibición",
    edition: "Pelota de béisbol · Gavin Lux",
    description:
      "Una pelota firmada por Gavin Lux acompañada de una caja de exhibición con imagen. Fotografía de referencia de MLB Shop; la autenticidad y disponibilidad de una pieza real deberán documentarse antes de ofrecerla a la venta.",
  },
  {
    id: "betts",
    name: "Mookie Betts · World Series 2020",
    category: "Memorabilia",
    universe: "MLB · Dodgers",
    price: 7800,
    stock: 1,
    image: "betts.jpg",
    tag: "EDICIÓN CONMEMORATIVA",
    condition: "Con caja de exhibición",
    edition: "World Series Champions 2020",
    description:
      "Un recuerdo de la Serie Mundial de 2020: pelota firmada por Mookie Betts en una caja conmemorativa. Fotografía de referencia de MLB Shop; esta ficha no constituye una certificación de autenticidad ni una oferta de venta real.",
  },
  {
    id: "vader-classic",
    name: "Darth Vader · Lightsaber Edition",
    category: "LEGO",
    universe: "Star Wars",
    price: 1200,
    stock: 4,
    image: "vader-classic.jpg",
    tag: "EL LADO OSCURO",
    condition: "Minifigura suelta",
    edition: "Darth Vader con sable de luz",
    description:
      "Casco, capa y sable rojo: una versión de Darth Vader para completar tu alineación imperial. Imagen de referencia de una minifigura con su accesorio; inventario y precio ilustrativos.",
  },
  {
    id: "pokemon",
    name: "Phantasmal Flames · Trainer Box",
    category: "TCG",
    universe: "Pokémon",
    price: 2900,
    stock: 3,
    image: "pokemon.png",
    tag: "PARA TU PRÓXIMA APERTURA",
    condition: "Caja sellada de referencia",
    edition: "Pokémon Center · Elite Trainer Box",
    description:
      "Una Elite Trainer Box de Phantasmal Flames para quienes disfrutan tanto de coleccionar como de abrir nuevos sobres. El contenido exacto de una unidad comercial deberá verificarse con el proveedor.",
  },
  {
    id: "imperial-duo",
    name: "Dark Side Duo · Vader + Boba",
    category: "LEGO",
    universe: "Star Wars",
    price: 2250,
    stock: 2,
    image: "vader.jpg",
    image2: "boba.jpeg",
    tag: "SET DE DOS PIEZAS",
    condition: "Dos minifiguras sueltas",
    edition: "Selección de la tienda",
    description:
      "Una selección de dos personajes que comparten un lugar en la historia de la galaxia: Darth Vader y Boba Fett. Paquete de demostración armado por Aldo’s Vault; no es un set oficial de LEGO.",
  },
];
export const money = (n) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
export function sanitizeCart(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const p of products) {
    const q = value[p.id];
    if (Number.isInteger(q) && q > 0) result[p.id] = Math.min(q, p.stock);
  }
  return result;
}
export function cartTotal(cart) {
  return products.reduce((sum, p) => sum + p.price * (cart[p.id] || 0), 0);
}
export function cartQuantity(cart) {
  return Object.values(cart).reduce((sum, n) => sum + n, 0);
}
export function changeCart(cart, id, quantity) {
  const p = products.find((p) => p.id === id);
  if (!p || !Number.isInteger(quantity) || quantity < 0 || quantity > p.stock)
    throw new Error("La cantidad solicitada no está disponible.");
  const next = { ...cart };
  if (quantity === 0) delete next[id];
  else next[id] = quantity;
  return next;
}
export function filterProducts(
  query = "",
  category = "Todas",
  sort = "featured",
) {
  let result = products.filter(
    (p) =>
      (category === "Todas" || p.category === category) &&
      `${p.name} ${p.category} ${p.universe}`
        .toLocaleLowerCase("es")
        .includes(query.trim().toLocaleLowerCase("es")),
  );
  if (sort === "price-asc") result.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") result.sort((a, b) => b.price - a.price);
  if (sort === "name")
    result.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return result;
}
