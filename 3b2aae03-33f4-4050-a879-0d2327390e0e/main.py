import pygame
import sys
import json
from pathlib import Path

# ---- Config ----
SCREEN_W, SCREEN_H = 960, 640
TILE = 32
GRID_W = SCREEN_W // TILE
GRID_H = SCREEN_H // TILE
FPS = 60
GRAVITY = 0.5
JUMP_V = -10
SAVE_FILE = Path("world_save.json")

# Colors
SKY = (135, 206, 235)
DIRT = (120, 72, 36)
GRASS = (90, 160, 60)
STONE = (110, 110, 110)
WOOD = (150, 100, 50)
SELECT = (255, 255, 0)
TEXT = (20, 20, 20)

BLOCK_TYPES = {
    0: ("air", None),
    1: ("dirt", DIRT),
    2: ("grass", GRASS),
    3: ("stone", STONE),
    4: ("wood", WOOD),
}

# ---- Utilities ----
def clamp(n, a, b):
    return max(a, min(b, n))

# ---- World ----
class World:
    def __init__(self, w, h):
        self.w = w
        self.h = h
        # 2D grid: [x][y] with origin (0,0) top-left
        self.grid = [[0 for _ in range(h)] for _ in range(w)]
        self.generate_basic_terrain()

    def generate_basic_terrain(self):
        # Simple layered terrain
        for x in range(self.w):
            ground_y = self.h // 2 + (1 if x % 7 == 0 else 0)
            for y in range(ground_y, self.h):
                if y == ground_y:
                    self.grid[x][y] = 2  # grass on top
                elif y < ground_y + 3:
                    self.grid[x][y] = 1  # dirt
                else:
                    self.grid[x][y] = 3  # stone

    def in_bounds(self, gx, gy):
        return 0 <= gx < self.w and 0 <= gy < self.h

    def get(self, gx, gy):
        if not self.in_bounds(gx, gy):
            return None
        return self.grid[gx][gy]

    def set(self, gx, gy, block):
        if self.in_bounds(gx, gy):
            self.grid[gx][gy] = block

    def save(self, fn=SAVE_FILE):
        data = {"w": self.w, "h": self.h, "grid": self.grid}
        with open(fn, "w") as f:
            json.dump(data, f)
        print("World saved to", fn)

    @classmethod
    def load(cls, fn=SAVE_FILE):
        if not fn.exists():
            return None
        with open(fn, "r") as f:
            data = json.load(f)
        w, h = data["w"], data["h"]
        world = cls(w, h)
        world.grid = data["grid"]
        return world

# ---- Player ----
class Player:
    def __init__(self, x, y):
        self.x = x  # float pixels
        self.y = y
        self.vx = 0
        self.vy = 0
        self.w = TILE - 4
        self.h = TILE * 1.8
        self.on_ground = False

    def rect(self):
        return pygame.Rect(int(self.x), int(self.y), int(self.w), int(self.h))

# ---- Game ----
def run():
    pygame.init()
    screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
    clock = pygame.time.Clock()
    font = pygame.font.SysFont(None, 20)

    # Load or create world
    world = World.load() or World(GRID_W, GRID_H)

    # Player spawn
    spawn_x = GRID_W // 2 * TILE
    spawn_y = (GRID_H // 2 - 5) * TILE
    player = Player(spawn_x + 2, spawn_y)

    # Inventory: simple dict block_type -> count (infinite for now)
    hotbar = [1, 2, 3, 4]  # block ids available
    hotbar_idx = 0

    show_grid = False

    def world_to_screen(gx, gy):
        return gx * TILE, gy * TILE

    def screen_to_world(px, py):
        return px // TILE, py // TILE

    def collide_with_world(rect):
        # Return whether rect collides with any solid block
        # Check blocks overlapping rect
        x1 = rect.left // TILE
        y1 = rect.top // TILE
        x2 = rect.right // TILE
        y2 = rect.bottom // TILE
        for gx in range(x1 - 1, x2 + 1):
            for gy in range(y1 - 1, y2 + 1):
                if not world.in_bounds(gx, gy):
                    continue
                if world.get(gx, gy) != 0:
                    block_rect = pygame.Rect(gx * TILE, gy * TILE, TILE, TILE)
                    if rect.colliderect(block_rect):
                        return True, block_rect
        return False, None

    running = True
    while running:
        dt = clock.tick(FPS) / 1000.0

        # ---- Input ----
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                if event.key == pygame.K_g:
                    show_grid = not show_grid
                if event.key == pygame.K_s and pygame.key.get_mods() & pygame.KMOD_CTRL:
                    world.save()
                if event.key == pygame.K_l and pygame.key.get_mods() & pygame.KMOD_CTRL:
                    loaded = World.load()
                    if loaded:
                        world = loaded
                        print("World loaded.")
                if pygame.K_1 <= event.key <= pygame.K_9:
                    idx = event.key - pygame.K_1
                    if idx < len(hotbar):
                        hotbar_idx = idx

            elif event.type == pygame.MOUSEBUTTONDOWN:
                mx, my = pygame.mouse.get_pos()
                gx, gy = screen_to_world(mx, my)
                if event.button == 1:  # left click -> place block
                    # Place block adjacent to clicked face (simple: place on clicked tile if empty)
                    if world.in_bounds(gx, gy) and world.get(gx, gy) == 0:
                        world.set(gx, gy, hotbar[hotbar_idx])
                elif event.button == 3:  # right click -> remove block
                    if world.in_bounds(gx, gy) and world.get(gx, gy) != 0:
                        world.set(gx, gy, 0)
                elif event.button == 4:  # scroll up
                    hotbar_idx = (hotbar_idx - 1) % len(hotbar)
                elif event.button == 5:  # scroll down
                    hotbar_idx = (hotbar_idx + 1) % len(hotbar)

        keys = pygame.key.get_pressed()
        # horizontal movement
        walk_speed = 180
        player.vx = 0
        if keys[pygame.K_a] or keys[pygame.K_LEFT]:
            player.vx = -walk_speed
        if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            player.vx = walk_speed
        # jump
        if (keys[pygame.K_w] or keys[pygame.K_UP] or keys[pygame.K_SPACE]) and player.on_ground:
            player.vy = JUMP_V
            player.on_ground = False

        # ---- Physics ----
        # Apply gravity
        player.vy += GRAVITY
        # Integrate
        new_x = player.x + player.vx * dt
        # Horizontal collision
        player_rect_h = pygame.Rect(int(new_x), int(player.y), int(player.w), int(player.h))
        collided, block_rect = collide_with_world(player_rect_h)
        if collided:
            # simple resolution: don't move horizontally
            new_x = player.x
            player.vx = 0
        player.x = new_x

        new_y = player.y + player.vy
        player_rect_v = pygame.Rect(int(player.x), int(new_y), int(player.w), int(player.h))
        collided, block_rect = collide_with_world(player_rect_v)
        if collided:
            # Resolve vertical collision
            if player.vy > 0:
                # landed on top
                player.y = block_rect.top - player.h
                player.vy = 0
                player.on_ground = True
            elif player.vy < 0:
                # hit ceiling
                player.y = block_rect.bottom
                player.vy = 0
        else:
            player.y = new_y
            player.on_ground = False

        # Keep player in screen bounds (wrap horizontally)
        player.x = clamp(player.x, 0, SCREEN_W - player.w)
        player.y = clamp(player.y, -1000, SCREEN_H - player.h)

        # ---- Render ----
        screen.fill(SKY)

        # Draw blocks
        for gx in range(world.w):
            for gy in range(world.h):
                b = world.get(gx, gy)
                if b == 0:
                    continue
                name, color = BLOCK_TYPES.get(b, ("unknown", (200, 200, 200)))
                rect = pygame.Rect(gx * TILE, gy * TILE, TILE, TILE)
                pygame.draw.rect(screen, color, rect)
                # top highlight for grass
                if b == 2:
                    pygame.draw.line(screen, (255, 255, 255), rect.topleft, rect.topright, 1)

        # Optional grid
        if show_grid:
            for x in range(0, SCREEN_W, TILE):
                pygame.draw.line(screen, (200, 200, 200), (x, 0), (x, SCREEN_H), 1)
            for y in range(0, SCREEN_H, TILE):
                pygame.draw.line(screen, (200, 200, 200), (0, y), (SCREEN_W, y), 1)

        # Draw player
        pygame.draw.rect(screen, (50, 50, 220), player.rect())

        # Draw UI - hotbar
        hotbar_y = SCREEN_H - TILE - 8
        for i, bid in enumerate(hotbar):
            box = pygame.Rect(8 + i * (TILE + 6), hotbar_y, TILE, TILE)
            pygame.draw.rect(screen, (240, 240, 240), box)
            name, color = BLOCK_TYPES[bid]
            if color:
                inner = box.inflate(-6, -6)
                pygame.draw.rect(screen, color, inner)
            if i == hotbar_idx:
                pygame.draw.rect(screen, SELECT, box, 3)

        # Draw selected block name
        sname = BLOCK_TYPES[hotbar[hotbar_idx]][0]
        txt = font.render(f"Selected: {hotbar_idx + 1} - {sname}   (LMB place, RMB remove, Scroll switch, G grid)", True, TEXT)
        screen.blit(txt, (8, 8))

        # Mouse hover outline
        mx, my = pygame.mouse.get_pos()
        gx, gy = screen_to_world(mx, my)
        if world.in_bounds(gx, gy):
            outline = pygame.Rect(gx * TILE, gy * TILE, TILE, TILE)
            pygame.draw.rect(screen, (0, 0, 0), outline, 2)

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    run()
