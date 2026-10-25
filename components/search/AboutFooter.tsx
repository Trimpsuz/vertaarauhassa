export default function AboutFooter() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-center">
      <p className="text-md text-muted-foreground">
        Tämä on{' '}
        <a className="underline cursor-pointer" href="https://github.com/Trimpsuz/vertaarauhassa">
          avoimen lähdekoodin
        </a>{' '}
        projekti
      </p>

      <div>
        <p className="text-sm text-muted-foreground">VertaaRauhassa {process.env.NEXT_PUBLIC_APP_VERSION}</p>
        <p className="text-sm text-muted-foreground">
          Emme ole <span className="italic">VR-Yhtymä Oyj:n</span>, sen tytäryhtiöiden tai sen yhteistyökumppanien kanssa sidoksissa tai millään tavalla virallisesti
          yhteydessä niihin. Virallinen verkkosivusto on osoitteessa{' '}
          <a className="underline cursor-pointer" href="https://www.vr.fi/">
            www.vr.fi
          </a>
          .
        </p>
      </div>
    </div>
  );
}
