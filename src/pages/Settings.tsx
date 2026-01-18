import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Mail,
  Users,
  Crown,
  Settings as SettingsIcon,
  Save,
} from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as configurações da sua conta e empresa
          </p>
        </div>

        <Tabs defaultValue="empresa" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="empresa" className="gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2">
              <Users className="h-4 w-4" />
              Equipe
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="integrações" className="gap-2">
              <Database className="h-4 w-4" />
              Integrações
            </TabsTrigger>
          </TabsList>

          {/* Empresa Tab */}
          <TabsContent value="empresa" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados da Empresa</CardTitle>
                <CardDescription>Informações cadastrais da sua empresa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      ME
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Alterar Logo
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG, JPG ou SVG. Máximo 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="razao">Razão Social</Label>
                    <Input id="razao" defaultValue="Minha Empresa Ltda" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fantasia">Nome Fantasia</Label>
                    <Input id="fantasia" defaultValue="Minha Empresa" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input id="cnpj" defaultValue="12.345.678/0001-90" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ie">Inscrição Estadual</Label>
                    <Input id="ie" placeholder="Digite a IE" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações Financeiras</CardTitle>
                <CardDescription>
                  Parâmetros para emissão de notas e recebíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="diaEmissao">Dia padrão de emissão NF</Label>
                    <Input id="diaEmissao" type="number" defaultValue="5" min="1" max="28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diaVencimento">Dia padrão de vencimento</Label>
                    <Input id="diaVencimento" type="number" defaultValue="15" min="1" max="28" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alertaDias">Alerta de vencimento (dias)</Label>
                    <Input id="alertaDias" type="number" defaultValue="7" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Perfil Tab */}
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Meu Perfil</CardTitle>
                <CardDescription>Suas informações pessoais e de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Alterar Foto
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      PNG ou JPG. Máximo 1MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" defaultValue="João da Silva" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" defaultValue="joao@empresa.com.br" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" defaultValue="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" defaultValue="Diretor Administrativo" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Alterar Senha</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="senhaAtual">Senha Atual</Label>
                      <Input id="senhaAtual" type="password" />
                    </div>
                    <div></div>
                    <div className="space-y-2">
                      <Label htmlFor="novaSenha">Nova Senha</Label>
                      <Input id="novaSenha" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                      <Input id="confirmarSenha" type="password" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="gap-2">
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipe Tab */}
          <TabsContent value="equipe" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Membros da Equipe</CardTitle>
                    <CardDescription>
                      Gerencie os usuários que têm acesso ao sistema
                    </CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Users className="h-4 w-4" />
                    Convidar Membro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "João da Silva", email: "joao@empresa.com.br", role: "Admin", initials: "JD" },
                    { name: "Maria Santos", email: "maria@empresa.com.br", role: "Financeiro", initials: "MS" },
                    { name: "Pedro Costa", email: "pedro@empresa.com.br", role: "Operacional", initials: "PC" },
                  ].map((member, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={member.role === "Admin" ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {member.role === "Admin" && <Crown className="h-3 w-3" />}
                          {member.role}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notificações Tab */}
          <TabsContent value="notificacoes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como e quando deseja receber alertas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contratos a vencer</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas sobre contratos próximos do vencimento
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notas fiscais a emitir</Label>
                      <p className="text-sm text-muted-foreground">
                        Lembretes sobre notas que precisam ser emitidas
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Faturas vencidas</Label>
                      <p className="text-sm text-muted-foreground">
                        Alertas sobre faturas em atraso
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Documentos expirando</Label>
                      <p className="text-sm text-muted-foreground">
                        Certidões e documentos próximos da validade
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por e-mail</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas também por e-mail
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrações Tab */}
          <TabsContent value="integrações" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrações</CardTitle>
                <CardDescription>
                  Conecte com outros sistemas e serviços
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">E-mail (SMTP)</p>
                      <p className="text-xs text-muted-foreground">
                        Envio de notificações e documentos por e-mail
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurar
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Database className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">NFS-e</p>
                      <p className="text-xs text-muted-foreground">
                        Integração com prefeituras para emissão de NFS-e
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Webhooks</p>
                      <p className="text-xs text-muted-foreground">
                        Receba notificações em sistemas externos
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Em breve</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
