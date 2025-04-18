import { PrismaClient } from '@prisma/client';
import { Router, Response } from 'express'; 
import { z } from 'zod';
import bcrypt from 'bcrypt';
import authMiddleware, { RequestWithAuth } from '../middleware/authMiddleware'; 

const prisma = new PrismaClient();
const router = Router();

const createUsuarioSchema = z.object({
    nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }),
    email: z.string().email({ message: "Email inválido" }),
    senha: z.string().min(6, { message: "Senha deve possuir, no mínimo, 6 caracteres" }),
});

const updateUsuarioSchema = z.object({
    nome: z.string().min(3, { message: "Nome deve possuir, no mínimo, 3 caracteres" }).optional(),
    email: z.string().email({ message: "Email inválido" }).optional(),
    senha: z.string().min(6, { message: "Senha deve possuir, no mínimo, 6 caracteres" }).optional(),
});

router.get("/", authMiddleware, async (req: RequestWithAuth, res: Response) => {
    console.warn("API GET /usuario está ativa e retornando todos os usuários para usuários logados. Considere restringir ou remover.");
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
            }
        });
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        res.status(500).json({ erro: "Erro ao listar usuários" }); 
    }
});

router.post("/", async (req, res) => {
    const valida = createUsuarioSchema.safeParse(req.body);
    if (!valida.success) {
        return res.status(400).json({ erro: "Dados inválidos", detalhes: valida.error.flatten().fieldErrors });
    }
    const { nome, email, senha } = valida.data;
    try {
        const hashedPassword = await bcrypt.hash(senha, 10);
        const usuario = await prisma.usuario.create({
            data: { nome, email, senha: hashedPassword }
        });
        const { senha: _, ...usuarioCriado } = usuario; 
        res.status(201).json({ message: "Usuário cadastrado com sucesso", usuario: usuarioCriado });
    } catch (error: any) {
        console.error("Erro ao criar usuário:", error);
        if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
             return res.status(409).json({ erro: "Este email já está cadastrado." });
        }
        res.status(500).json({ erro: "Erro interno ao cadastrar usuário." });
    }
});

router.get("/:id", authMiddleware, async (req: RequestWithAuth, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) return res.status(400).json({ erro: "ID inválido." });

    const usuarioIdLogado = req.user?.userId;
    if (!usuarioIdLogado) return res.status(401).json({ erro: "Usuário não autenticado." });

    if (usuarioIdLogado !== numericId) {
        console.log(`Tentativa não autorizada: User ${usuarioIdLogado} tentando acessar perfil ${numericId}`);
        return res.status(403).json({ erro: "Você só pode visualizar seu próprio perfil." });
    }

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { id: numericId },
            select: {
                id: true,
                nome: true,
                email: true,
            }
        });

        if (!usuario) {
            return res.status(404).json({ erro: "Usuário não encontrado" }); 
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Erro ao obter usuário por ID:", error);
        res.status(500).json({ erro: "Erro interno ao obter usuário" }); 
    }
});

router.get("/me/avaliacoes", authMiddleware, async (req: RequestWithAuth, res: Response) => {
    const usuarioIdLogado = req.user?.userId;

    if (!usuarioIdLogado) {
        return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    try {
        const gibisDoUsuario = await prisma.gibi.findMany({
            where: {
                excluido: false,
                OR: [
                    { notas: { some: { usuarioId: usuarioIdLogado } } },
                    { comentarios: { some: { usuarioId: usuarioIdLogado } } }
                ]
            },
            select: { 
                id: true,
                titulo: true,
                ano: true,
                sinopse: true, 
                capaUrl: true,
            },
            orderBy: {
                titulo: 'asc' 
            }
        });

        console.log(`API: Retornando ${gibisDoUsuario.length} gibis avaliados/comentados para usuário ${usuarioIdLogado}`);
        res.status(200).json(gibisDoUsuario);

    } catch (error) {
        console.error(`API: Erro ao buscar gibis do usuário ${usuarioIdLogado}:`, error);
        res.status(500).json({ erro: "Erro ao buscar suas avaliações e comentários." });
    }
});

router.put("/:id", authMiddleware, async (req: RequestWithAuth, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) return res.status(400).json({ erro: "ID inválido." });

    const usuarioIdLogado = req.user?.userId;
    if (!usuarioIdLogado) return res.status(401).json({ erro: "Usuário não autenticado." });

    if (usuarioIdLogado !== numericId) {
         return res.status(403).json({ erro: "Você só pode editar seu próprio perfil." });
    }

    const valida = updateUsuarioSchema.safeParse(req.body);
    if (!valida.success) {
        return res.status(400).json({ erro: "Dados inválidos", detalhes: valida.error.flatten().fieldErrors });
    }

    const { nome, email, senha } = valida.data; 

    try {
         const dadosParaAtualizar: { nome?: string; email?: string; senha?: string } = {};
         if (nome !== undefined) dadosParaAtualizar.nome = nome;
         if (email !== undefined) dadosParaAtualizar.email = email;
         if (senha !== undefined) {

             dadosParaAtualizar.senha = await bcrypt.hash(senha, 10);
         }

         if (Object.keys(dadosParaAtualizar).length === 0) {
             return res.status(400).json({ erro: "Nenhum dado fornecido para atualização." });
         }

        const usuarioAtualizado = await prisma.usuario.update({
            where: { id: numericId },
            data: dadosParaAtualizar
        });

        const { senha: _, ...usuarioRetorno } = usuarioAtualizado; 
        res.status(200).json(usuarioRetorno);

    } catch (error: any) {
        console.error("Erro ao atualizar usuário:", error);

        if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
             return res.status(409).json({ erro: "Este email já está em uso por outra conta." });
        }
        res.status(500).json({ erro: "Erro interno ao atualizar usuário" });
    }
});

router.delete("/:id", authMiddleware, async (req: RequestWithAuth, res: Response) => {
    const { id } = req.params;
    const numericId = Number(id);
    if (isNaN(numericId)) return res.status(400).json({ erro: "ID inválido." });

    const usuarioIdLogado = req.user?.userId;
    if (!usuarioIdLogado) return res.status(401).json({ erro: "Usuário não autenticado." });

    if (usuarioIdLogado !== numericId) {
         return res.status(403).json({ erro: "Você só pode excluir seu próprio perfil." });
    }

    try {
        await prisma.usuario.delete({
            where: { id: numericId },
        });
        res.status(204).send(); 

    } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
         if (error?.code === 'P2003') { 
             return res.status(409).json({ erro: "Não é possível excluir usuário pois ele possui registros associados (comentários, notas, etc.)." });
        }
        res.status(500).json({ erro: "Erro interno ao excluir usuário" });
    }
});

export default router;