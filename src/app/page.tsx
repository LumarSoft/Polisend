import { JsonLd } from "@/components/seo/json-ld";
import { Reveals } from "@/components/ui/primitives";
import { Nav } from "@/components/sections/nav";
import { Hero } from "@/components/sections/hero";
import { Marquee } from "@/components/sections/marquee";
import { Problem } from "@/components/sections/problem";
import { Story } from "@/components/sections/story";
import { Features } from "@/components/sections/features";
import { Speed } from "@/components/sections/speed";
import { Handoff } from "@/components/sections/handoff";
import { Panel } from "@/components/sections/panel";
import { Integrations } from "@/components/sections/integrations";
import { Config } from "@/components/sections/config";
import { Steps } from "@/components/sections/steps";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { FinalCta, Footer } from "@/components/sections/final-cta";

export default function Home() {
  return (
    <>
      <JsonLd />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Problem />
        <Story />
        <Features />
        <Speed />
        <Handoff />
        <Panel />
        <Integrations />
        <Config />
        <Steps />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <Reveals />
    </>
  );
}
