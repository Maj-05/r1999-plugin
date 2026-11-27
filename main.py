"""重返未来：1999 离线图鉴的 AstrBot 入口。"""
import asyncio
import json
from pathlib import Path

from astrbot.api import logger
from astrbot.api.event import AstrMessageEvent, filter
from astrbot.api.star import Context, Star


class R1999Plugin(Star):
    def __init__(self, context: Context):
        super().__init__(context)
        self.cli = Path(__file__).resolve().parent / "lib" / "cli.mjs"
        self.slots = asyncio.Semaphore(2)

    async def lookup(self, command):
        async with self.slots:
            child = await asyncio.create_subprocess_exec(
                "node", str(self.cli), stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
            )
            try:
                payload = json.dumps({"command": command}).encode()
                stdout, stderr = await child.communicate(payload)
                if child.returncode:
                    raise RuntimeError(stderr.decode(errors="replace")[:1000])
                result = json.loads(stdout)
                text = result["text"]
                if result.get("state"):
                    text += "\n在查询末尾加「第2页」翻页，或按 ID 查询详情。"
                return text
            finally:
                if child.returncode is None:
                    try:
                        child.kill()
                    except ProcessLookupError:
                        pass
                    await child.wait()

    @filter.command("r1999", alias={"1999"})
    async def guide(self, event: AstrMessageEvent):
        """离线图鉴，例如 /r1999 角色 槲寄生 或 /r1999 心相 六星 第2页。"""
        parts = event.get_message_str().strip().split(maxsplit=1)
        command = parts[1] if len(parts) > 1 else "帮助"
        if len(command) > 256:
            yield event.plain_result("查询过长，请限制在 256 字以内。")
            return
        try:
            text = await asyncio.wait_for(self.lookup(command), timeout=12)
        except FileNotFoundError:
            text = "请在 AstrBot 所在的运行环境安装 Node.js 20 或更高版本。"
        except asyncio.TimeoutError:
            text = "查询繁忙，请稍后重试。"
        except (OSError, ValueError, RuntimeError, KeyError) as error:
            logger.error(f"r1999 查询失败: {error}")
            text = "图鉴读取失败，请检查插件安装是否完整。"
        yield event.plain_result(text)
