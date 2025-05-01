/*
	Installed from https://reactbits.dev/tailwind/
*/

const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  children,
  ...rest
}) => {
  return (
    <Component
      className={`relative inline-block py-[1px] overflow-hidden rounded-[20px] ${className}`}
      {...rest}
      >
        <div
            className="absolute inset-0 rounded-[20px] border-[1px] pointer-events-none"
              style={{
                  boxShadow: `0 0 5px 0px ${color}`,
                  animation: `border-glow ${speed} linear infinite`,
                  borderColor: `${color}80` // Añadimos transparencia al color del borde

              }}
        ></div>

        <div
            className="absolute w-full h-[1px] top-0 left-[-100%] animate-border-run opacity-50"
            style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  animationDuration: speed,
              }}
        ></div>
        <div
            className="absolute w-full h-[1px] bottom-0 right-[-100%] animate-border-run-reverse opacity-50"
            style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  animationDuration: speed,
              }}
        ></div>
      <div className="relative z-1 border border-gray-800 text-white text-center text-[16px] py-[16px] px-[26px] rounded-[20px] backdrop-blur-md bg-balck/10 border-white/10 hover:bg-white/30 transition-all duration-300">
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;

// tailwind.config.js
// module.exports = {
//   theme: {
//     extend: {
//       animation: {
//         'star-movement-bottom': 'star-movement-bottom linear infinite alternate',
//         'star-movement-top': 'star-movement-top linear infinite alternate',
//       },
//       keyframes: {
//         'star-movement-bottom': {
//           '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
//           '100%': { transform: 'translate(-100%, 0%)', opacity: '0' },
//         },
//         'star-movement-top': {
//           '0%': { transform: 'translate(0%, 0%)', opacity: '1' },
//           '100%': { transform: 'translate(100%, 0%)', opacity: '0' },
//         },
//       },
//     },
//   }
// }
