import asyncio
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class Paddle:
    def __init__(self, y):
        self.y = y

class Ball:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Game:
    def __init__(self, game_id, player1_id, player2_id):
        self.game_id = game_id
        self.player1_id = player1_id
        self.player2_id = player2_id
        self.paddle1 = Paddle(50)
        self.paddle2 = Paddle(50)
        self.ball = Ball(50, 50)
        self.player1_score = 0
        self.player2_score = 0
        self.current_tick = 3
        
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
        
        # start game


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