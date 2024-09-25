const authLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative h-full flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-white opacity-10 rounded-full -top-16 -left-20 animate-pulse duration-5000"></div>
      <div className="absolute w-[400px] h-[400px] bg-white opacity-5 rounded-full -bottom-32 -right-10 animate-pulse"></div>

      <div className="absolute w-full h-full bg-gradient-to-br from-green-300 to-transparent opacity-20 animate-float"></div>

      <div className="relative z-10 bg-white/10 backdrop-blur-sm p-10 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default authLayout;
