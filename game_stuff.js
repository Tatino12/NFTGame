
var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var player;
var stars;
var bombs;
var platforms;
var cursors;
var score = 0;
var lives = 1;
var level = 0; 
var gameOver = false;
var scoreText;
var livesText;
var levelText;
var velocity = 160

var game = new Phaser.Game(config);

function preload ()
{
  //this.load.image('sky', './assets/sky.png');
  this.load.image('ground', './assets/platform.png');
  this.load.image('star', './assets/star.png');
  this.load.image('bomb', './assets/bomb.png');
  this.load.spritesheet('dude', './assets/dude.png', { frameWidth: 32, frameHeight: 48 });
  this.load.image('bg', 'assets/undersea-bg.png');
  this.load.spritesheet('fish', 'assets/fish-136x80.png', { frameWidth: 136, frameHeight: 80 });
}

function create ()
{
  
  //  A simple background for our game
  this.add.image(400, 300, 'bg');
  var particles = this.add.particles('fish');

    particles.createEmitter({
        frame: { frames: [ 0, 1, 2 ], cycle: true },
        x: -70,
        y: { start: 100, end: 900, steps: 4 },
        lifespan: 40000,
        speedX: 30,
        frequency: 10000
    });

  //  The platforms group contains the ground and the 2 ledges we can jump on
  platforms = this.physics.add.staticGroup();

  //  Here we create the ground.
  //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();

  //  Now let's create some ledges
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  // The player and its settings
  player = this.physics.add.sprite(100, 450, 'dude');

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);// este es el rebote cuando cae
  player.setCollideWorldBounds(true); //para que el personaje no pueda correr o saltar fuera de la pantalla

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
      key: 'left',
      frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1 //El valor'repeat -1' indica que la animación debe volver a empezar cuando termine.

  });

  this.anims.create({
      key: 'turn',
      frames: [ { key: 'dude', frame: 4 } ],
      frameRate: 20
  });

  this.anims.create({
      key: 'right',
      frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1
  });

  //  Input Events
  cursors = this.input.keyboard.createCursorKeys(); //phaser me brinda la opcion para manejar con las flechas

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  stars = this.physics.add.group({
      key: 'star', //la clave es la imagen de la estrella
      repeat: 11, // una estrella se crea sola, por eso aplico 11 mas.
      setXY: { x: 12, y: 0, stepX: 70 } //posicion de las estrellas 
  }); //Los valores de 'step' son una manera realmente útil de separar los elementos de un grupo durante su creación

  stars.children.iterate(function (child) {

      //  Give each star a slightly different bounce
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); //rebote de las estrellas

  });

  bombs = this.physics.add.group();

  
  //  The score , lives, and level
  scoreText = this.add.text(16, 5, 'Score: 0', { fontSize: '22px', fill: '#000' });
  livesText = this.add.text(678, 5, 'Lives: 1', { fontSize: '22px', fill: '#000' });
  levelText = this.add.text(16, 35, 'Level: 0', { fontSize: '22px', fill: '#000' });
  

  //  Collide the player and the stars with the platforms
  this.physics.add.collider(player, platforms); // el collider me detecta si hay colision entre ambos, es el q hace la magia.
  this.physics.add.collider(stars, platforms); //hay que habilitar que choquen con las plataformas para que 
  this.physics.add.collider(bombs, platforms); //no se hundan en la pantalla.

  //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
  this.physics.add.overlap(player, stars, collectStar, null, this); //si se superpone el personaje con una
  // estrella se activa la funcion collectstar

  this.physics.add.collider(player, bombs, hitBomb, null, this); //Las bombas rebotarán en 
  //las plataformas, y cuando contacten con el personaje se ejecutará la función hitBomb.
}


function update ()
{
  if (gameOver)
  {
    return;
  }

  if (cursors.left.isDown)
  {
    player.setVelocityX(-velocity); // si se mueve a la izq

    player.anims.play('left', true); // aplico la animacion para la izq
  }
  else if (cursors.right.isDown) // sino todo lo contrario para la derecha
  {
    player.setVelocityX(velocity);

    player.anims.play('right', true);
  }
  else
  {
    player.setVelocityX(0); // si esta quieto 

    player.anims.play('turn'); //queda el personaje de frente
  }

  if (cursors.up.isDown && player.body.touching.down) //si estoy saltando y toco el piso
  {
    player.setVelocityY(-330);
  }
}

function collectStar (player, star)
{
  star.disableBody(true, true);//se desactiva el cuerpo físico de la estrella y con esto se vuelve inactiva
  // e invisible, lo que la elimina de la pantalla.

  //  Add and update the score
  score += 10;
  scoreText.setText('Score: ' + score);
  
  

  if (stars.countActive(true) === 0) //countActive para saber cuántas estrellas quedan.
  {
    level += 1;
    levelText.setText('Level: ' + level);
   
//Si no hay ninguna es por que se han recolectado todas, así que usamos la función de iteración para volver
// a habilitar todas las estrellas y restablecer su posición Y a cero.
    stars.children.iterate(function (child) {

        child.enableBody(true, child.x, 0, true, true);

    });

  //Primero elegimos una coordenada X aleatoria, siempre en el lado opuesto a donde se encuentra el personaje para darle una oportunidad
    var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

// Luego se crea la bomba, se indica que no se pueda salir del mundo, que rebota y que tiene una velocidad aleatoria.
    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    var particles = this.add.particles('fish');
    particles.createEmitter({
      frame: { frames: [ 0, 1, 2 ], cycle: true },
      x: -70,
      y: { start: 100, end: 800, steps: 4 },
      lifespan: 40000,
      speedX: 20,
      frequency: 50600
  });
  }
}

function hitBomb (player, bomb)
{

 this.physics.pause(); //cuando la bomba toca el personaje, el juego finaliza 

  
  lives -= 1;
  livesText.setText('Lives: ' + lives);
  //alert('GAME OVER!')
   
Swal.fire({
  title: 'GAME OVER!!!',
  width: 500,
  padding: '1em',
  color: '#dc143c',
  background: '#fff url(https://sweetalert2.github.io/images/trees.png)',
  backdrop: `
    rgba(0,0,123,0.4)
    url("https://sweetalert2.github.io/images/nyan-cat.gif")
    left center
    no-repeat
  `
})

setTimeout(function(){
  window.location.reload(1);
}, 3000); // reinicio el juego cada 3 segundos


  player.setTint(0xff0000);//y el personaje se pinta de rojo

  player.anims.play('turn');

  gameOver = true;
  
}

function playerBalanceCallback(balance)
{ 
  if(balance >= 1)
  {
    player.setTint(0xFFD700)
    velocity = 320
  }
}
