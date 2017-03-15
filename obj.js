/**
 * Created by tttt on 04.12.2016.
 */
var Entity = {
    pos_x: 0, pos_y: 0, // позиция объекта
    size_x: 0, size_y: 0, // размеры объекта
    extend: function (extendProto) { // расширение сущности
        var object = Object.create(this); // создание нового объекта
        for (var property in extendProto) { // для всех свойств нового объекта
            if (this.hasOwnProperty(property) || typeof object[property] === 'undefined') {
                // если свойства отсутствуют в родительском объекте, то добавляем
                object[property] = extendProto[property];
            }
        }
        return object;
    }
};

var target = Entity.extend({


    update: function () {

    },
    onTouchEntity: function (obj) {

    }

});

var Player = Entity.extend({
    move_x: 0, move_y: 0,
    direction: 1,
    dirSprite: null,
    shooting: false,
    size_x : 32,
    size_y : 32,
    speed: 32,
    draw: function (ctx) {// прорисовка объекта
        spriteManager.drawSprite(ctx, this.dirSprite, this.pos_x, this.pos_y);
    },
    update: function () {

        var result = physicManager.update(this);

        if (result === 'left') {
            this.direction = 0;
            this.dirSprite = 'player_left';

        }
        if (result === 'right') {
            this.direction = 1;
            this.dirSprite = 'player_right';

        }
        if (result === 'up') {
            this.direction = 3;
            this.dirSprite = 'player_up';

        }
        if (result === 'down') {
            this.direction = 2;
            this.dirSprite = 'player_down';

        }
    },
    onTouchEntity: function (obj)
    {
        if(obj.name==="ball")
        {
            obj.move_y=this.move_y;
            obj.move_x=this.move_x;
            obj.update();
        }

    },
    onTouchMap:function (obj) {

    }
});

var ball = Entity.extend({
    win:false,
    move_x: 0, move_y: 0,
    direction: 1,
    dirSprite: "ball",
    shooting: false,
    speed: 32,
    size_x : 32,
    size_y : 32,
    draw: function (ctx) {// прорисовка объекта
        spriteManager.drawSprite(ctx, this.dirSprite, this.pos_x, this.pos_y);
    },
        update: function ()
        {
            var result = physicManager.update(this);
            if (result === 'left') {
                this.direction = 0;


            }
            if (result === 'right') {
                this.direction = 1;


            }
            if (result === 'up') {
                this.direction = 3;


            }
            if (result === 'down') {
                this.direction = 2;

            }
        },
        onTouchEntity: function (obj)
        {

        },
    onTouchMap:function (obj,e)
    {
        if(obj===2&&e===null)
        {
            this.win=true;
            soundManager.play("music/zv.mp3",{looping: false, volume: 1});
        }
        if(obj!==2&&e===null)
        {
            this.win=false;
        }
    }

    }
);
var rock = Entity.extend({

    draw: function (ctf) {
        spriteManager.drawSprite(ctx, "rock",this.pos_x , this.pos_y);
    },
    update: function () {
        phisicManager.update(this)
    },
    onTouchEntity: function (obj) {

    }
});

