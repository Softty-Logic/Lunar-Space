// KHỞI TẠO CÁC BIẾN TRẠNG THÁI ============================================

// Biến điều khiển hoạt ảnh nhảy của cừu
var mouseDown = false;
var sheepVAngle = 0;          // Góc của hàm Sin để tạo quỹ đạo nhảy
var sheepBaseY = -0.2;        // Toạ độ Y mặc định của cừu khi đứng trên mặt đất
var groundTopY = 0.5;         
var sheepIsJumping = false;   // Trạng thái cừu có đang nhảy hay không
var jumpStarted = false;      // Đánh dấu cú nhảy đã bắt đầu

// Biến điều khiển Camera
var cameraPan = { x: 0, z: 0 }; // Lưu độ lệch khi kéo (pan) camera
var cameraDistance = 25;        // Khoảng cách từ camera đến hòn đảo (dùng để zoom)

// ============================================================================
// XỬ LÝ SỰ KIỆN TƯƠNG TÁC (CHUỘT & CẢM ỨNG)
// ============================================================================

// Lắng nghe sự kiện click chuột để kích hoạt cừu nhảy
document.addEventListener('mousedown', function(e) {
  // Bỏ qua nếu click vào các nút giao diện UI (nếu có)
  if (e.target?.classList?.contains('toggle') || e.target?.classList?.contains('toggle-music')) return;
  
  // Nếu cừu đang đứng yên, cho phép nhảy
  if (!jumpStarted && !sheepIsJumping) {
    jumpStarted = true;
    sheepIsJumping = true;
  }
});

// Lắng nghe sự kiện lăn con trỏ chuột (Scroll) để Zoom và Kéo Camera
document.addEventListener('wheel', function(e) {
  if (e.ctrlKey) {
    // Nếu giữ phím Ctrl + Lăn chuột -> Phóng to / Thu nhỏ (Zoom)
    e.preventDefault();
    if (e.deltaY < 0) cameraDistance *= 0.9; // Cuộn lên -> Phóng to
    else cameraDistance *= 1.1;              // Cuộn xuống -> Thu nhỏ
    
    // Giới hạn khoảng cách zoom (không được gần quá 5 hoặc xa quá 50)
    cameraDistance = Math.max(5, Math.min(50, cameraDistance));
  } else {
    // Nếu chỉ lăn chuột bình thường -> Kéo camera (Pan) theo trục Z
    e.preventDefault();
    if (e.deltaY > 0) cameraPan.z -= 2;
    else cameraPan.z += 2;
  }
}, { passive: false });

// Lắng nghe sự kiện chạm trên màn hình điện thoại (Tương tự click chuột)
document.addEventListener('touchstart', function(e) {
  if (e.target?.classList?.contains('toggle') || e.target?.classList?.contains('toggle-music')) return;
  e.preventDefault();
  if (!jumpStarted && !sheepIsJumping) {
    jumpStarted = true;
    sheepIsJumping = true;
  }
}, { passive: false });

// ============================================================================
// CÁC HÀM XỬ LÝ LOGIC
// ============================================================================

// Hàm tính toán toạ độ Y của cừu dựa trên hàm lượng giác (Sin)
function sheepJump(speed) {
  sheepVAngle += speed;
  var jumpHeight = 1.2; // Độ cao của cú nhảy
  // Quỹ đạo nhảy parabol: Toạ độ gốc + (Giá trị Sin * Độ cao)
  var newY = sheepBaseY + (Math.sin(sheepVAngle) * jumpHeight);
  sheep.position.y = newY;
}

// Hàm quản lý vòng đời của một cú nhảy
function sheepJumpOnce() {
  if (!jumpStarted) return; // Nếu chưa click thì không làm gì
  
  // Chạy nửa chu kỳ của hình Sin (từ 0 đến Pi) để cừu bay lên rồi đáp xuống
  if (sheepVAngle < Math.PI) {
    sheepJump(0.08); // Tốc độ nhảy
  } else {
    // Khi góc vượt quá Pi (chạm đất), reset các giá trị về ban đầu
    sheepVAngle = 0;
    sheep.position.y = sheepBaseY;
    sheepIsJumping = false;
    jumpStarted = false;
  }
}

// ============================================================================
// THIẾT LẬP MÔI TRƯỜNG THREE.JS (SCENE, CAMERA, RENDERER)
// ============================================================================

var pi = Math.PI;
var scene = new THREE.Scene(); // Tạo phân cảnh 3D
var h = window.innerHeight, w = window.innerWidth;
var aspectRatio = w / h, fieldOfView = 45;

// Tính toán các mặt phẳng cắt (Near/Far plane) để tối ưu render
var cameraDistanceFromOrigin = Math.sqrt(25*25 + 5*5);
var sceneRadius = 15;
var nearPlane = Math.max(0.1, cameraDistanceFromOrigin - sceneRadius - 5);
var farPlane = cameraDistanceFromOrigin + sceneRadius + 50;

// Khởi tạo Camera phối cảnh (PerspectiveCamera)
var camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);

// Khởi tạo Renderer (Công cụ vẽ ra màn hình)
const theCanvas = document.getElementById("artboard");
theCanvas.width = w;
theCanvas.height = h;

var renderer = new THREE.WebGLRenderer({
    canvas: theCanvas,
    alpha: true,      // Nền trong suốt để thấy được background CSS
    antialias: true   // Khử răng cưa cho viền vật thể mịn màng
});
renderer.setSize(w, h, false);
renderer.shadowMap.enabled = true; // Bật đổ bóng
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Đặt vị trí Camera ban đầu
camera.position.set(25, 5, 0);
camera.lookAt(new THREE.Vector3(0, 4, 0)); // Camera luôn nhìn vào tâm đảo

// ============================================================================
// HỆ THỐNG ÁNH SÁNG (3-POINT LIGHTING)
// ============================================================================

var col_light = 0xffffff;

// Ánh sáng môi trường (Làm sáng đều mọi vật)
var light = new THREE.AmbientLight(col_light, 0.8);

// Ánh sáng chính (Key Light) - Tạo ra bóng đổ sắc nét
var keyLight = new THREE.DirectionalLight(col_light, 0.9);
keyLight.position.set(20, 30, 10);
keyLight.castShadow = true;
keyLight.shadow.camera.top = 20;

// Ánh sáng phụ (Fill Light) - Làm mềm các vùng bóng đen
var fillLight = new THREE.DirectionalLight(col_light, 0.5);
fillLight.position.set(-20, 20, 20);

// Ánh sáng viền (Back Light) - Nhấn mạnh hình khối từ phía sau
var backLight = new THREE.DirectionalLight(col_light, 0.3);
backLight.position.set(10, 0, -20);

// Nguồn sáng dạng điểm (Đổi màu lấp lánh theo thời gian)
var pointLight = new THREE.PointLight(0xff00ff, 0.5, 100);
pointLight.position.set(0, 10, 0);

// Thêm toàn bộ đèn vào scene
scene.add(light);
scene.add(keyLight);
scene.add(fillLight);
scene.add(backLight);
scene.add(pointLight);

// ============================================================================
// ĐỊNH NGHĨA VẬT LIỆU (MATERIALS)
// ============================================================================

var mat_orange = new THREE.MeshStandardMaterial({ color: 0x2b5876, metalness: 0.2, roughness: 0.8 }); // Đất
var mat_grey = new THREE.MeshStandardMaterial({ color: 0xe0eaf5, metalness: 0.1, roughness: 0.9 });   // Lông cừu / Thân cây
var mat_yellow = new THREE.MeshStandardMaterial({ color: 0x00d2d3, metalness: 0.3, roughness: 0.6 }); // Tán lá
var mat_dark = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.9 });   // Mắt / Chân / Đáy đảo
var mat_brown = new THREE.MeshStandardMaterial({ color: 0x576574, metalness: 0.2, roughness: 0.7 });  // Gỗ
var mat_stone = new THREE.MeshStandardMaterial({ color: 0x8395a7, metalness: 0.5, roughness: 0.5 });  // Đá
var mat_skin = new THREE.MeshStandardMaterial({ color: 0x747d8c, metalness: 0.1, roughness: 0.9 });   // Da mặt cừu

// ============================================================================
// DỰNG HÌNH (MODELING) - MẶT ĐẤT & ĐÁY ĐẢO
// ============================================================================

var layers = [];
var ground = new THREE.Group();
// Dựng các tầng đất xếp chồng lên nhau thành bậc thang
for (var i = 0; i < 5; i++) {
  var h_layer = 0.1;
  var geometry = new THREE.CylinderGeometry(8 - i - 0.01, 8 - i, h_layer, 9);
  layers.push(new THREE.Mesh(geometry, mat_orange));
  layers[i].position.y = h_layer * i;
  layers[i].receiveShadow = true;
  ground.add(layers[i]);
}
// Căn chỉnh ngẫu nhiên các tầng đất để tạo vẻ tự nhiên (low-poly)
layers[0].scale.x = 0.8;
layers[1].scale.set(0.77, 1, 0.91);
layers[1].rotation.y = ((2 * pi) / 9) * 0.6;
layers[2].scale.set(0.8, 1, 0.91);
layers[2].rotation.y = ((2 * pi) / 9) * 0.3;
layers[3].scale.set(0.75, 1, 0.92);
layers[3].rotation.y = ((2 * pi) / 9) * 0.7;
layers[4].scale.set(0.7, 1, 0.93);
layers[4].rotation.y = ((2 * pi) / 9) * 0.9;

// Dựng phần chóp nhọn dưới đáy hòn đảo
var geo_base = new THREE.CylinderGeometry(8, 1, 10, 9);
var base = new THREE.Mesh(geo_base, mat_dark);
base.scale.x = layers[0].scale.x;
base.position.y = -5;
ground.add(base);
scene.add(ground);

// ============================================================================
// DỰNG HÌNH - CÂY XANH
// ============================================================================

var tree = new THREE.Group();
// Thân cây chính
var geo_trunk = new THREE.IcosahedronGeometry(9, 0); // Sử dụng khối 20 mặt
var trunk = new THREE.Mesh(geo_trunk, mat_grey);
trunk.rotation.x = pi / 2;
trunk.position.y = 5;
trunk.scale.set(0.03, 0.03, 1);
trunk.castShadow = true;
trunk.receiveShadow = true;
tree.add(trunk);

// Tán cây trên đỉnh
var geo_crown = new THREE.IcosahedronGeometry(2.5, 0);
var crown = new THREE.Mesh(geo_crown, mat_yellow);
crown.scale.y = 0.4;
crown.rotation.z = -0.5;
crown.rotation.x = -0.2;
crown.position.set(trunk.position.x, 12, trunk.position.z);
crown.castShadow = true;
tree.add(crown);

// Tạo nhóm lá và cành nhỏ
var leaf = new THREE.Group();
var mainStem = new THREE.Mesh(geo_trunk, mat_grey);
mainStem.scale.set(0.007, 0.007, 0.16);
mainStem.rotation.x = pi / 2;
mainStem.castShadow = true;
leaf.add(mainStem);

// Phiến lá
var geo_blade = new THREE.CylinderGeometry(0.7, 0.7, 0.05, 12);
var blade = new THREE.Mesh(geo_blade, mat_yellow);
blade.rotation.z = pi / 2;
blade.scale.x = 1.2;
blade.position.set(-0.05, 0.4, 0);
blade.castShadow = true;
leaf.add(blade);

// Các gân lá nhỏ (nhân bản từ thân chính)
var subStems = [];
for (var i = 0; i < 8; i++) {
  subStems[i] = mainStem.clone();
  subStems[i].scale.set(0.0055, 0.0055, 0.01);
  subStems[i].castShadow = true;
  leaf.add(subStems[i]);
}
// Bố trí gân lá chéo nhau
subStems[0].rotation.x = -pi / 4; subStems[0].scale.z = 0.04; subStems[0].position.set(0, 0.8, 0.2);
subStems[2].rotation.x = -pi / 6; subStems[2].scale.z = 0.05; subStems[2].position.set(0, 0.5, 0.25);
subStems[4].rotation.x = -pi / 8; subStems[4].scale.z = 0.055; subStems[4].position.set(0, 0.2, 0.3);
subStems[6].rotation.x = -pi / 10; subStems[6].scale.z = 0.045; subStems[6].position.set(0, -0.1, 0.26);

for (var i = 1; i < 8; i += 2) {
  subStems[i].rotation.x = -subStems[i - 1].rotation.x;
  subStems[i].scale.z = subStems[i - 1].scale.z;
  subStems[i].position.set(0, subStems[i - 1].position.y, -subStems[i - 1].position.z);
}
leaf.rotation.x = pi / 3;
leaf.rotation.z = 0.2;
leaf.position.set(trunk.position.x - 0.2, 5, trunk.position.z + 1);
tree.add(leaf);

// Nhân bản lá thứ hai
var leaf_1 = leaf.clone();
leaf_1.rotation.x = -pi / 3;
leaf_1.position.set(trunk.position.x - 0.2, 6, trunk.position.z - 1);
tree.add(leaf_1);
tree.rotation.y = -pi / 12;
tree.position.set(-2, 0, -2);
scene.add(tree);

// Nhân bản cây số 2 và 3 ra xung quanh đảo
var tree_1 = tree.clone();
tree_1.scale.set(0.8, 0.8, 0.8);
tree_1.position.set(-1, 0, -5);
tree_1.rotation.y = -pi / 5;
scene.add(tree_1);

var tree_2 = tree.clone();
tree_2.scale.set(0.7, 0.7, 0.7);
tree_2.position.set(-2, 0, 0.5);
tree_2.rotation.y = -pi / 12;
tree_2.children[2].rotation.x = -pi / 3;
tree_2.children[2].position.z = trunk.position.z - 1;
tree_2.children[3].rotation.x = pi / 3;
tree_2.children[3].position.z = trunk.position.z + 1;
scene.add(tree_2);

// ============================================================================
// DỰNG HÌNH - NHỮNG VIÊN ĐÁ NGẪU NHIÊN
// ============================================================================

var geo_stone = new THREE.DodecahedronGeometry(1, 0); // Khối 12 mặt
var stone = [];
for (var i = 0; i < 2; i++) {
  stone[i] = new THREE.Mesh(geo_stone, mat_stone);
  scene.add(stone[i]);
  stone[i].castShadow = true;
}
stone[0].rotation.set(0, 12, pi / 2);
stone[0].scale.set(3, 1, 1);
stone[0].position.set(-1, 1, 4.6);
stone[1].rotation.set(0, 0, pi / 2);
stone[1].scale.set(1, 1, 1);
stone[1].position.set(0, 0.7, 5.3);

// ============================================================================
// DỰNG HÌNH - NHÂN VẬT CHÍNH (CỪU)
// ============================================================================

var sheep = new THREE.Group();

// Đầu cừu
var geo_sheepHead = new THREE.IcosahedronGeometry(1, 0);
var sheepHead = new THREE.Mesh(geo_sheepHead, mat_skin);
sheepHead.scale.z = 0.6;
sheepHead.scale.y = 1.1;
sheepHead.position.y = 2.5;
sheepHead.rotation.x = -0.2;
sheepHead.castShadow = true;
sheep.add(sheepHead);

// Thân cừu
var geo_sheepBody = new THREE.IcosahedronGeometry(3.5, 0);
var sheepBody = new THREE.Mesh(geo_sheepBody, mat_grey);
sheepBody.position.set(0, sheepHead.position.y, -2.2);
sheepBody.scale.set(0.5, 0.5, 0.6);
sheepBody.rotation.set(0, 0, pi / 3);
sheepBody.castShadow = true;
sheep.add(sheepBody);

// Đuôi cừu
var geo_tail = new THREE.IcosahedronGeometry(0.5, 0);
var tail = new THREE.Mesh(geo_tail, mat_grey);
tail.position.set(sheepHead.position.x, sheepHead.position.y + 1.2, -3.8);
tail.castShadow = true;
sheep.add(tail);

// Lông trên đỉnh đầu (Các cục bông nhỏ)
var hair = [];
var geo_hair = new THREE.IcosahedronGeometry(0.4, 0);
for (var i = 0; i < 5; i++) {
  hair[i] = new THREE.Mesh(geo_hair, mat_grey);
  hair[i].castShadow = true;
  sheep.add(hair[i]);
}
hair[0].position.set(-0.4, sheepHead.position.y + 0.9, -0.1);
hair[1].position.set(0, sheepHead.position.y + 1, -0.1);
hair[2].position.set(0.4, sheepHead.position.y + 0.9, -0.1);
hair[3].position.set(-0.1, sheepHead.position.y + 0.9, -0.4);
hair[4].position.set(0.12, sheepHead.position.y + 0.9, -0.4);

hair[0].rotation.set(pi / 12, 0, pi / 3);
hair[1].rotation.set(pi / 12, pi / 6, pi / 3);
hair[2].rotation.set(pi / 12, 0, pi / 3);
hair[3].rotation.set(pi / 12, 0, pi / 3);
hair[4].rotation.set(pi / 12, pi / 6, pi / 3);

hair[0].scale.set(0.6, 0.6, 0.6);
hair[2].scale.set(0.8, 0.8, 0.8);
hair[3].scale.set(0.7, 0.7, 0.7);
hair[4].scale.set(0.6, 0.6, 0.6);

// 4 Chân cừu
var legs = [];
var geo_leg = new THREE.CylinderGeometry(0.15, 0.1, 1, 5);
for (var i = 0; i < 4; i++) {
  legs[i] = new THREE.Mesh(geo_leg, mat_dark);
  legs[i].castShadow = true;
  legs[i].receiveShadow = true;
  sheep.add(legs[i]);
}
legs[0].position.set(0.5, 1.1, -1.5);
legs[1].position.set(-0.5, 1.1, -1.5);
legs[2].position.set(0.8, 1.1, -3);
legs[3].position.set(-0.8, 1.1, -3);

// Bàn chân (Móng)
var feet = [];
var geo_foot = new THREE.DodecahedronGeometry(0.2, 0);
for (var i = 0; i < legs.length; i++) {
  feet[i] = new THREE.Mesh(geo_foot, mat_dark);
  sheep.add(feet[i]);
  feet[i].scale.set(1, 0.8, 1);
  feet[i].castShadow = true;
  feet[i].receiveShadow = true;
  feet[i].position.set(legs[i].position.x, 0, legs[i].position.z + 0.09);
}
feet[0].position.y = 0.56;
feet[1].position.y = 0.66;
feet[2].position.y = 0.7;
feet[3].position.y = 0.7;

// Lòng trắng mắt
var geo_eye = new THREE.CylinderGeometry(0.3, 0.2, 0.05, 8);
var eyes = [];
for (var i = 0; i < 2; i++) {
  eyes[i] = new THREE.Mesh(geo_eye, mat_grey);
  sheep.add(eyes[i]);
  eyes[i].castShadow = true;
  eyes[i].position.set(0, sheepHead.position.y + 0.1, 0.5);
  eyes[i].rotation.x = pi / 2 - pi / 15;
}
eyes[0].position.x = 0.3;
eyes[1].position.x = -eyes[0].position.x;
eyes[0].rotation.z = -pi / 15;
eyes[1].rotation.z = -eyes[0].rotation.z;

// Con ngươi đen (Sẽ được cập nhật toạ độ khi di chuột)
var geo_eyeball = new THREE.SphereGeometry(0.11, 8, 8);
var eyeballs = [];
for (var i = 0; i < 2; i++) {
  eyeballs[i] = new THREE.Mesh(geo_eyeball, mat_dark);
  sheep.add(eyeballs[i]);
  eyeballs[i].castShadow = true;
  eyeballs[i].position.set(eyes[i].position.x, eyes[i].position.y, eyes[i].position.z + 0.02);
}

// Chốt vị trí cừu trên đảo
sheep.position.set(4.8, -0.2, -1);
sheep.scale.set(0.8, 0.8, 0.8);
sheep.rotation.set(0, pi / 4, 0);
scene.add(sheep);

// ============================================================================
// DỰNG HÌNH - HÀNG RÀO GỖ
// ============================================================================

var fenceGroup = new THREE.Group();
var woodPlanks = [];
var geo_wood = new THREE.BoxGeometry(1, 1, 1); // Khối lập phương dẹt làm thanh gỗ
for (var i = 0; i < 4; i++) {
  woodPlanks[i] = new THREE.Mesh(geo_wood, mat_brown);
  woodPlanks[i].castShadow = true;
  woodPlanks[i].receiveShadow = true;
  fenceGroup.add(woodPlanks[i]);
}
// Ghép 2 cọc dọc và 2 thanh ngang
woodPlanks[0].scale.set(0.15, 1.7, 0.4);
woodPlanks[1].scale.set(0.15, 1.8, 0.4);
woodPlanks[2].scale.set(0.1, 0.3, 3.2);
woodPlanks[3].scale.set(0.1, 0.3, 3.2);

woodPlanks[0].position.set(0, 1.2, -1);
woodPlanks[1].position.set(0, 1, 1);
woodPlanks[2].position.set(0, 1.5, 0);
woodPlanks[3].position.set(0.12, 0.9, 0);
woodPlanks[3].rotation.x = pi / 32;
woodPlanks[2].rotation.x = -pi / 32;
woodPlanks[2].rotation.y = pi / 32;

fenceGroup.position.set(3, 0, 2);
fenceGroup.rotation.y = pi / 5;
scene.add(fenceGroup);

// ============================================================================
// HỆ THỐNG HẠT (PARTICLES) - ĐOM ĐÓM BAY LƠ LỬNG
// ============================================================================

var firefliesGeo = new THREE.BufferGeometry();
var firefliesCount = 60; // Số lượng hạt
var posArray = new Float32Array(firefliesCount * 3); // Mảng chứa Toạ độ X, Y, Z

// Khởi tạo vị trí ngẫu nhiên cho 60 hạt đom đóm
for(let i = 0; i < firefliesCount * 3; i+=3) {
    posArray[i] = (Math.random() - 0.5) * 20;     // X rải rác
    posArray[i+1] = Math.random() * 8 + 1;        // Y cách mặt đất 1 khoảng
    posArray[i+2] = (Math.random() - 0.5) * 20;   // Z rải rác
}

firefliesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
var firefliesMat = new THREE.PointsMaterial({
    size: 0.15,
    color: 0xffffff, // Đom đóm màu trắng tinh tú
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending // Hoà trộn tạo độ chói (Sáng lên khi chồng nhau)
});

var fireflies = new THREE.Points(firefliesGeo, firefliesMat);
scene.add(fireflies);

// ============================================================================
// VÒNG LẶP RENDER (ANIMATION LOOP)
// ============================================================================

var startTime = Date.now();
var animationTime = 0;

var render = function () {
  requestAnimationFrame(render); // Liên tục gọi lại hàm này ở frame tiếp theo (thường 60fps)
  animationTime = (Date.now() - startTime) * 0.001;
  
  // 1. Cho mặt đất xoay từ từ (Đảo tự xoay)
  ground.rotation.y += 0.0005;
  
  // 2. Animation của đàn đom đóm (Xoay quanh đảo và lượn sóng lên xuống)
  fireflies.rotation.y += 0.002;
  fireflies.position.y = Math.sin(animationTime * 1.5) * 0.2;
  
  // 3. Xử lý nhảy của cừu
  sheepJumpOnce();
  
  // 4. Xử lý vị trí Camera dựa trên tương tác chuột
  var camX = 25 + cameraPan.x;
  var camY = 5;
  var camZ = cameraPan.z;
  
  // Cập nhật vị trí bị giới hạn bởi Zoom
  var distanceFromOrigin = Math.sqrt(camX * camX + camZ * camZ);
  if (distanceFromOrigin > 0) {
    camX = (camX / distanceFromOrigin) * cameraDistance;
    camZ = (camZ / distanceFromOrigin) * cameraDistance;
  }
  
  camera.position.set(camX, camY, camZ);
  camera.lookAt(new THREE.Vector3(0, 4, 0)); // Luôn chĩa ống kính vào trung tâm
  
  // 5. Làm đèn chuyển màu theo thời gian
  pointLight.color.setHSL((animationTime * 0.1) % 1, 1, 0.5);
  
  // 6. Xuất hình ảnh ra trình duyệt
  renderer.render(scene, camera);
};

render(); // Bắt đầu vòng lặp

// Lắng nghe sự kiện thu/phóng cửa sổ trình duyệt để tính lại khung hình
window.addEventListener('resize', function() {
  var newW = window.innerWidth;
  var newH = window.innerHeight;
  camera.aspect = newW / newH;
  camera.updateProjectionMatrix();
  renderer.setSize(newW, newH, false);
});

// ============================================================================
// LOGIC LIẾC MẮT (RAYCASTING GIẢ - THEO DÕI TRỤC XY)
// ============================================================================

theCanvas.addEventListener("mousemove", function (evt) {
  var rect = theCanvas.getBoundingClientRect();
  var mouseX = evt.clientX - rect.left;
  var mouseY = evt.clientY - rect.top;

  // Tính toán độ lệch của chuột so với tâm màn hình
  var offsetX = 0.2 / rect.width * (mouseX - rect.width / 2);
  var offsetY = 0.3 / rect.height * (mouseY - (rect.height * 2) / 5);
  
  // Dịch chuyển tròng đen (eyeballs) theo độ lệch đó
  if (eyeballs && eyeballs.length > 0) {
      eyeballs[0].position.x = eyes[0].position.x + offsetX;
      eyeballs[0].position.y = eyes[0].position.y - offsetY;
      eyeballs[1].position.x = eyes[1].position.x + offsetX;
      eyeballs[1].position.y = eyes[1].position.y - offsetY;
  }
});