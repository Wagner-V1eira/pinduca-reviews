import { PrismaClient, Role } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendEmail } from '../utils/enviaEmai';

const prisma = new PrismaClient();
const router = Router();

const requestPasswordResetSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
});

router.post("/request-password-reset", async (req: Request, res: Response) => {
    const validation = requestPasswordResetSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ erro: "Email inválido.", detalhes: validation.error.flatten().fieldErrors });
    }
    const { email } = validation.data;

    try {
        const usuario = await prisma.usuario.findUnique({ where: { email } });

        if (!usuario) {
            console.log(`Solicitação de reset para email não encontrado: ${email}`);
            return res.status(200).json({ message: "Se um usuário com este email existir, um link de redefinição foi enviado." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = await bcrypt.hash(resetToken, 10); 

        const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);

        await prisma.usuario.update({
            where: { email },
            data: {
                codRecuperaSenha: hashedResetToken,
                codRecuperaSenhaExpiracao: resetTokenExpires,
            },
        });

        const frontendResetUrl = `${process.env.FRONTEND_URL}/redefinir-senha?token=${resetToken}&email=${encodeURIComponent(email)}`;

        await sendEmail({
            to: usuario.email,
            subject: 'Redefinição de Senha - Pinduca Reviews',
            text: `Prezado usuário, você solicitou uma redefinição de senha. Clique no link para criar uma nova senha: ${frontendResetUrl}\nSe você não solicitou isso, ignore este email.\nO link expira em 30 minutos.`,
            html: `<p>Prezado usuário, você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha:</p><a href="${frontendResetUrl}">${frontendResetUrl}</a><p>Se você não solicitou isso, ignore este email.</p><p>O link expira em 30 minutos.</p>`,
        });
            
        return res.status(200).json({ message: "Se um usuário com este email existir, um link de redefinição foi enviado." });

    } catch (error) {
        console.error("Erro ao solicitar redefinição de senha:", error);
        return res.status(500).json({ erro: "Erro interno ao processar sua solicitação." });
    }
});


const resetPasswordSchema = z.object({
    email: z.string().email({ message: "Email inválido" }),
    token: z.string().min(1, { message: "Token de recuperação é obrigatório" }),
    novaSenha: z.string().min(6, { message: "A nova senha deve ter pelo menos 6 caracteres" }),
    confirmarNovaSenha: z.string(),
}).refine(data => data.novaSenha === data.confirmarNovaSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarNovaSenha"],
});

router.post("/reset-password", async (req: Request, res: Response) => {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ erro: "Dados inválidos.", detalhes: validation.error.flatten().fieldErrors });
    }
    const { email, token, novaSenha } = validation.data;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email },
        });

        if (!usuario || !usuario.codRecuperaSenha || !usuario.codRecuperaSenhaExpiracao) {
            return res.status(400).json({ erro: "Token inválido ou solicitação não encontrada." });
        }
        if (new Date() > usuario.codRecuperaSenhaExpiracao) {
            return res.status(400).json({ erro: "Token de recuperação expirado." });
        }

        const isTokenValid = await bcrypt.compare(token, usuario.codRecuperaSenha); 
        if (!isTokenValid) {
            return res.status(400).json({ erro: "Token de recuperação inválido." });
        }

        const hashedNovaSenha = await bcrypt.hash(novaSenha, 10);
        await prisma.usuario.update({
            where: { email },
            data: {
                senha: hashedNovaSenha,
                codRecuperaSenha: null, 
                codRecuperaSenhaExpiracao: null,
            },
        });

        return res.status(200).json({ message: "Senha redefinida com sucesso!" });

    } catch (error) {
        console.error("Erro ao redefinir senha:", error);
        return res.status(500).json({ erro: "Erro interno ao redefinir sua senha." });
    }
});

export default router;