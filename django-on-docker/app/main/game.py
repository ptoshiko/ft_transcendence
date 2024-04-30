import asyncio
import random
import math
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from datetime import time

class Direction:
    def __init__(self):
        self.x = 0
        self.y = 0

class Paddle:
    def __init__(self, y):
        self.y = y

class Ball:
    def __init__(self):
        self.x = 50
        self.y = 50
        self.direction = Direction()
        self.velocity = 0.025
        while (abs(self.direction.x) <= 0.2 or abs(self.direction.y) >= 0.9):
            heading = random.uniform(0, 2 * math.pi)
            self.direction.x = math.cos(heading)
            self.direction.y = math.sin(heading)

    def update(self, delta):
        self.x += self.direction.x * self.velocity * delta
        self.y += self.direction.y * self.velocity * delta
        if self.y <= 0 or self.y >= 100:
            self.direction.y *= -1

class Game:
    def __init__(self, game_id, player1_id, player2_id):
        self.game_id = game_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.paddle1 = Paddle(50)
        self.paddle2 = Paddle(50)
        self.ball = Ball()
        self.player1_score = 0
        self.player2_score = 0
        self.current_tick = 3
        self.not_finished = True
        self.last_time = None
        
    async def tick(self):
        await asyncio.sleep(1)
        channel_layer = get_channel_layer()
        await asyncio.gather(channel_layer.group_send(
            f"{self.player1_id}",
            {
                'type': 'game_tick', 
                'tick': self.current_tick
            }
        ), channel_layer.group_send(
            f"{self.player2_id}",
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
            channel_layer = get_channel_layer()
            await asyncio.gather(channel_layer.group_send(
                f"{self.player1_id}",
                {
                    'type': 'game_state', 
                    'ball_x': self.ball.x,
                    'ball_y': self.ball.y,
                }
            ), channel_layer.group_send(
                f"{self.player2_id}",
                {
                    'type': 'game_state', 
                    'ball_x': self.ball.x,
                    'ball_y': self.ball.y,
                }
            ))
            await self.update_game(time.time()-self.start)
            await asyncio.sleep(0.02)
    
    async def update_game(self, tm):
        if self.last_time is not None:
            delta = tm - self.last_time
            self.ball.update(delta)

        self.last_time = tm     


class GameManager:
    def __init__(self):
        self.queue = asyncio.Queue(10)
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
        

game_manager = GameManager()