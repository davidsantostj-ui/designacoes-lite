const OfflineBanner = ({ isOnline }) => {
  if (isOnline) return null;
  return (
    <div className="px-4 py-2 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-widest text-center">
      Sem conexão. Algumas ações serão enviadas quando a internet voltar.
    </div>
  );
};

export default OfflineBanner;
