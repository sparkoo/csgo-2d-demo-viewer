console.log("hello there")

let currentWeapon = 0
let weapons = ["knife", "usp-s", "glock", "flash", "he", "smoke", "molotov",
  "incendiary", "decoy"]
let mapPlayerWeapons = Array.from(
    document.getElementsByClassName("playerMapWeapon"))

function updateWeapon(weapon) {
  mapPlayerWeapons.forEach(w => {
    w.src = `/assets/icons/csgo/${weapon}.svg`
    w.className = `playerMapWeapon ${weapon}`
  })
}

document.onkeydown = function (e) {
  console.log(e)
  let number = Number(e.key)
  if (number) {
    console.log("is number")
    currentWeapon = number - 1
  } else if (e.key === "r") {
    currentWeapon++;
    if (currentWeapon >= weapons.length) {
      currentWeapon = 0;
    }
  }
  updateWeapon(weapons[currentWeapon])
}
