/**
 * Created by tttt on 04.12.2016.
 */
var eventsManager = {
    bind: [], // сопоставление клавиш действиям
    action: [], // действия

    setup: function () { // настройка сопоставления
        this.bind[87] = 'up'; // w - двигаться вверх
        this.bind[65] = 'left'; // a - двигаться влево
        this.bind[83] = 'down'; // s - двигаться вниз
        this.bind[68] = 'right'; // d - двигаться вправо

        document.body.addEventListener("keydown", this.onKeyDown);
        document.body.addEventListener("keyup", this.onKeyUp);
    },
    onKeyDown: function (event)
    {
        var action = eventsManager.bind[event.keyCode];
        if (action === 'left' || action === 'up' || action === 'down' || action === 'right')
        {
            eventsManager.action[action] = true; // выполняем действие
        }
    },
    onKeyUp: function (event)
    {
        var action = eventsManager.bind[event.keyCode];
        if (action)
            eventsManager.action[action] = false; // отменили действие
    }
};


/////////////////////////
//////physicManager/////////////
/////////////////////////

var physicManager = {
    update: function (obj) {
        if (obj.move_x === 0 && obj.move_y === 0)
            return "stop"; // скорости движения нулевые

        var newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        var newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);

        // анализ пространства на карте по направлению движения
        var ts = mapManager.getTilesetIdx(newX + obj.size_x / 2, newY + obj.size_y / 2);
        var e = this.entityAtXY(obj, newX, newY); // объект на пути
        if (e !== null && obj.onTouchEntity) // если есть конфликт
            obj.onTouchEntity(e); // разбор конфликта внутри объекта
        if (ts !== 0 && obj.onTouchMap) // есть препятствие
            obj.onTouchMap(ts,e); // разбор конфликта с препятствием внутри объекта
        if(ts===0&&e===null&&obj.name==="ball")
        {
            obj.win=false;
        }

        if (((ts === 0||ts===2) && e === null)||(obj.name==="player"&&e.name==="ball"&&this.entityAtXY(obj, newX, newY)===null)) { // перемещаем объект на свободное место
            obj.pos_x = newX;
            obj.pos_y = newY;
            if(obj.name==="ball")
            {
                obj.move_y=0;
                obj.move_x=0;

            }
        } else
            return "break"; // дальше двигаться нельзя

        switch (obj.move_x + 2 * obj.move_y) {
            case -1: // двигаемся влево
                return "left";
                break;
            case 1: // двигаемся вправо
                return "right";
                break;
            case -2: // двигаемся вверх
                return "up";
                break;
            case 2: // двигаемся вниз
                return "down";
                break;
        }
    },
    entityAtXY: function (obj, x, y) { // поиск объекта по координатам
        var k=0;
        if(obj.name==="ball")
        {
            k=1;
        }
        for (var i = 0; i < gameManager.entities.length; i++) {
            var e = gameManager.entities[i]; // рассматриваем все объекты на карте
            if (e.pos_y !== obj.pos_y||e.pos_x!== obj.pos_x) { // не совпадает
                if (x + obj.size_x + k< e.pos_x || // не пересекаются
                    y + obj.size_y + k< e.pos_y ||
                    x-k > e.pos_x + e.size_x ||
                    y-k> e.pos_y + e.size_y)
                    continue;
                return e; // найден объект
            }
        }
        return null; // объект не найден
    }
};


var gameManager = { // менеджер игры
    factory: {}, // фабрика объектов на карте
    entities: [], // объекты на карте
    player: null, // указатель на объект игрока
    enemy: null,
    laterKill: [], // отложенное уничтожение объектов
    initPlayer: function (obj) { // инициализация игрока
        this.player = obj;
    },
    update: function () { // обновление информации
        if (this.player === null)
            return;
        this.player.move_x = 0;
        this.player.move_y = 0;
        if (eventsManager.action["up"]) this.player.move_y = -1;
        if (eventsManager.action["down"]) this.player.move_y = 1;
        if (eventsManager.action["left"]) this.player.move_x = -1;
        if (eventsManager.action["right"]) this.player.move_x = 1;

        //обновление информации по всем объектам на карте
        var winwin=true;
        this.entities.forEach(function (e) {
            try {
                if(e.name==="ball")
                {
                    winwin=winwin&e.win;
                }
                e.update();
            } catch (ex) {
            }
        });
        // this.time++;
        if(winwin)
        {
            document.location.href = "/Game/win.html";
        }
        mapManager.draw(ctx);
        // mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.draw(ctx);
    },
    draw: function (ctx) {
        for (var e = 0; e < this.entities.length; e++) {
            this.entities[e].draw(ctx);
        }
    },
    loadAll: function () {
        soundManager.init();
        soundManager.loadArray(['music/t.mp3' , 'music/zv.mp3']);
        soundManager.play('music/t.mp3', {looping: true, volume: 1});
        mapManager.loadMap("map2.json"); // загрузка карты
        spriteManager.loadAtlas("sprites.json", "spritesheet.png"); // загрузка атласа
        gameManager.factory['player'] = Player; // инициализация фабрики
        gameManager.factory['target'] = target;
        gameManager.factory['rock'] = rock;
        gameManager.factory['ball'] = ball;
        mapManager.parseEntities(); // разбор сущностей карты
        mapManager.draw(ctx); // отобразить карту
        eventsManager.setup(); // настройка событий
    },
    play: function () {
        gameManager.loadAll();
        setInterval(updateWorld, 100);
    }
};


var soundManager = {
    clips: {}, // звуковые эффекты
    context: null, // аудиоконтекст
    gainNode: null, // главный узел
    loaded: false, // все звуки загружены
    init: function () {
        // инициализация
        this.context = new AudioContext();
        this.gainNode = this.context.createGain ? this.context.createGain() : this.context.createGainNode();
        this.gainNode.connect(this.context.destination);
    },
    load: function (path, callback) { // загрузка одного аудиовъфайла
        if (this.clips[path]) {
            callback(this.clips[path]);
            return;
        }
        var clip = {path: path, buffer: null, loaded: false};
        clip.play = function (volume, loop) {
            soundManager.play(this.path,{looping: loop?loop:false, volume: volume ? volume:1});

        };
        this.clips[path] = clip;
        var request = new XMLHttpRequest();
        request.open("GET", path, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            soundManager.context.decodeAudioData(request.response, function (buffer) {
                clip.buffer = buffer;
                clip.loaded = true;
                callback(clip);
            });
        };
        request.send();
    },
    loadArray: function (array) {
        // загрузка массива звуков
        for (var i = 0; i < array.length; i++) {
            soundManager.load(array[i], function () {
                if (array.length === Object.keys(soundManager.clips).length) {
                    for (var sd in soundManager.clips)
                        if (!soundManager.clips[sd].loaded) return;
                    soundManager.loaded = true;
                }
            });
        }
    },
    play: function (path, settings) {
        if (!soundManager.loaded) {
            setTimeout(function () {
                soundManager.play(path,settings);
            }, 1000);
            return;
        }
        var looping = false;
        var volume = 1;
        if (settings) {
            if (settings.looping)
                looping = settings.looping;
            if (settings.volume)
                volume = settings.volume;
        }
        var sd = this.clips[path];
        if (sd === null) return false;
        // создаем нвоый экземпляр проигрывателя BufferSOurce
        var sound = soundManager.context.createBufferSource();
        sound.buffer = sd.buffer;
        sound.connect(soundManager.gainNode);
        sound.loop = looping;
        soundManager.gainNode.gain.value = volume;
        sound.start(0);
        return true;
    },
    stopAll: function () {
        this.gainNode.disconnect();
    }
};
function updateWorld() {
    gameManager.update();
}