import asyncio
import random
import math
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import time

class Direction:
    def __init__(self):
        self.x = 0
        self.y = 0

class Paddle:
    def __init__(self, player_id):
        self.player_id = player_id
        self.reset()

    async def up(self):
        if self.y > 0:
            self.y -= 1

    async def down(self):
        if self.y < 100:
            self.y += 1

    def isInColision(self, ball_y):
        if ball_y < (self.y + 7.5) and ball_y > (self.y - 7.5):
            return True
        
        return False
    
    def add_score(self):
        self.score += 1
    
    def reset(self):
        self.y = 50
        self.score = 0

class Ball:
    def __init__(self):
        self.reset()

    def update(self):
        self.x = self.x + (self.direction.x * self.velocity)
        self.y = self.y + (self.direction.y * self.velocity)
        self.velocity = self.velocity + 0.00005
        if self.y <= 1.5 or self.y >= 98.5:
            self.direction.y *= -1

    def reset(self):
        self.x = 50
        self.y = 50
        self.direction = Direction()
        self.velocity = 0.025
        while (abs(self.direction.x) <= 0.2 or abs(self.direction.y) >= 0.9):
            heading = random.uniform(0, 2 * math.pi)
            self.direction.x = math.cos(heading)
            self.direction.y = math.sin(heading)

    def update(self):
        self.x = self.x + (self.direction.x * self.velocity)
        self.y = self.y + (self.direction.y * self.velocity)
        self.velocity += 0.0001
        if self.y <= 0 or self.y >= 100:
            self.direction.y *= -1

class Game:
    def __init__(self, game_id, player1_id, player2_id):
        self.game_id = game_id
        self.ball = Ball()
        self.player1_score = 0
        self.player2_score = 0
        self.current_tick = 3
        self.not_finished = True
        self.last_time = None
        self.left_paddle = Paddle(player1_id)
        self.right_paddle = Paddle(player2_id)
        self.is_left_won = False
        self.is_right_won = False
        
    async def tick(self):
        await asyncio.sleep(1)
        channel_layer = get_channel_layer()
        await asyncio.gather(channel_layer.group_send(
            f"{self.left_paddle.player_id}",
            {
                'type': 'game_tick', 
                'tick': self.current_tick
            }
        ), channel_layer.group_send(
            f"{self.right_paddle.player_id}",
            {
                'type': 'game_tick', 
                'tick': self.current_tick
            }
        ))

        self.current_tick -= 1


    async def start_tick(self):            
        for _ in range(3):
            await self.tick()
    
    async def start_game(self):
        await self.start_tick()

        self.start = time.time()

        while (self.not_finished):
            
            tm = time.time()-self.start
            await self.update_game(tm)
            channel_layer = get_channel_layer()
            await asyncio.gather(channel_layer.group_send(
                f"{self.left_paddle.player_id}",
                {
                    'type': 'game_state', 
                    'ball_x': self.ball.x,
                    'ball_y': self.ball.y,
                    'left_paddle_y': self.left_paddle.y,
                    'right_paddle_y': self.right_paddle.y,
                    'left_score': self.left_paddle.score,
                    'right_score': self.right_paddle.score,
                    'is_left_won': self.is_left_won,
                    'is_right_won': self.is_right_won,
                }
            ), channel_layer.group_send(
                f"{self.right_paddle.player_id}",
                {
                    'type': 'game_state', 
                    'ball_x': self.ball.x,
                    'ball_y': self.ball.y,
                    'left_paddle_y': self.left_paddle.y,
                    'right_paddle_y': self.right_paddle.y,
                    'left_score': self.left_paddle.score,
                    'right_score': self.right_paddle.score,
                    'is_left_won': self.is_left_won,
                    'is_right_won': self.is_right_won,
                }
            ))
            await asyncio.sleep(0.02)
    
    async def update_game(self, tm):
        if self.last_time is not None:
            delta = tm - self.last_time
            self.ball.update()
            if (self.ball.x <= 3.5 and self.left_paddle.isInColision(self.ball.y)) or (self.ball.x >= 96.5 and self.right_paddle.isInColision(self.ball.y)):
                self.ball.direction.x *= -1
            elif (self.ball.x <= 3.5 and not self.left_paddle.isInColision(self.ball.y)):
                self.right_paddle.add_score()
                if self.right_paddle.score >= 1:
                    self.won()
                else:
                    self.reset()
            elif (self.ball.x >= 96.5 and not self.right_paddle.isInColision(self.ball.y)):
                self.left_paddle.add_score()
                if self.left_paddle.score >= 1:
                    self.won()
                else:
                    self.reset()

        self.last_time = tm   

    async def up_paddle_by_user_id(self, user_id):
        if self.left_paddle.player_id == user_id:
            await self.left_paddle.up()
        else:
            await self.right_paddle.up()

    async def down_paddle_by_user_id(self, user_id):
        if self.left_paddle.player_id == user_id:
            await self.left_paddle.down()
        else:
            await self.right_paddle.down()

    def reset(self):
        self.ball.reset()
        self.left_paddle.reset()
        self.right_paddle.reset()

    def won(self):
        if self.left_paddle.score > self.right_paddle.score:
            self.is_left_won = True
        else:
            self.is_right_won = True
        self.not_finished = False 

class GameManager:
    def __init__(self):
        self.games = []  # Initialize an empty list to store games
        
    def create_game(self, game_id, player1_id, player2_id):
        game = Game(game_id, player1_id, player2_id)
        self.games.append(game)
        # asyncio.create_task(game.start_game())
        return game

    def get_game_by_id(self, game_id):
        for game in self.games:
            if game.game_id == game_id:
                return game
        return None
    
    def get_game_by_user_id(self, user_id):
        for i in range (len(self.games)):
            if (self.games[i].left_paddle.player_id == user_id or self.games[i].right_paddle.player_id == user_id):
                return self.games[i]
        return None

    def get_game_by_users(self, user1_id, user2_id):
        for i in range (len(self.games)):
            if ((self.games[i].left_paddle.player_id == user1_id and self.games[i].right_paddle.player_id == user2_id)) or ((self.games[i].left_paddle.player_id == user2_id and self.games[i].right_paddle.player_id == user1_id)):
                return self.games[i]
        return None
        

game_manager = GameManager()