import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, Mail, Clock, MapPin } from 'lucide-react';

const Ajuda = () => {
  const faqItems = [
    {
      question: 'Como faço para agendar um horário?',
      answer: 'Você pode agendar um horário através da página "Meus Agendamentos". Selecione o serviço desejado, escolha o barbeiro de sua preferência e o horário disponível.',
    },
    {
      question: 'Como funciona o programa de fidelidade?',
      answer: 'A cada serviço realizado, você acumula pontos. Quando atingir 10 pontos, você recebe automaticamente um cupom de desconto que pode ser usado no próximo agendamento.',
    },
    {
      question: 'Posso cancelar ou reagendar meu horário?',
      answer: 'Sim! Você pode cancelar ou reagendar seu horário através da página "Meus Agendamentos". Recomendamos fazer isso com pelo menos 2 horas de antecedência.',
    },
    {
      question: 'Como uso meus cupons de desconto?',
      answer: 'Seus cupons estão disponíveis na seção "Marketing". No momento do agendamento, você pode informar o código do cupom para aplicar o desconto automaticamente.',
    },
    {
      question: 'Posso escolher meu barbeiro favorito?',
      answer: 'Sim! Durante o agendamento, você pode selecionar o barbeiro de sua preferência ou escolher "Qualquer barbeiro disponível".',
    },
    {
      question: 'Como atualizo minhas informações de perfil?',
      answer: 'Acesse a página "Perfil" no menu lateral. Lá você pode atualizar suas informações pessoais, telefone e foto de perfil.',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Central de Ajuda
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Encontre respostas para suas dúvidas ou entre em contato conosco
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-primary/20 hover:border-primary/40 transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">Telefone</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Ligue para nós</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:+5511999999999">(11) 99999-9999</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">WhatsApp</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Envie uma mensagem</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                  Abrir WhatsApp
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-smooth">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-base sm:text-lg">E-mail</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Envie um e-mail</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:contato@dallasbarbearia.com.br">Enviar E-mail</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl">Perguntas Frequentes</CardTitle>
            <CardDescription>
              Encontre respostas rápidas para as dúvidas mais comuns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm sm:text-base">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Business Hours and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Horário de Funcionamento</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Estamos abertos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Segunda a Sexta:</span>
                <span className="font-medium">09:00 - 20:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sábado:</span>
                <span className="font-medium">09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Domingo:</span>
                <span className="font-medium">Fechado</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg sm:text-xl">Nossa Localização</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Visite-nos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Rua Exemplo, 123 - Centro<br />
                São Paulo - SP<br />
                CEP: 01234-567
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver no Mapa
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Ajuda;
